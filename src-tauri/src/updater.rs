//! 应用自更新：检查 GitHub Release → 下载对应平台的安装包 → 主应用退出后，
//! 同一个二进制以 `--acta-update-wizard <manifest>` 重新拉起"更新向导"实例，
//! 由向导完成安装并自动打开新版本。
//!
//! 平台差异：
//! - Windows（便携版单 exe）：向导等待主进程退出后，把运行中的 exe 改名为
//!   `*.acta-old`（Windows 允许改名运行中的映像），把新 exe 移回原路径并启动；
//!   新版本下次启动时清理 `*.acta-old`。
//! - macOS：向导挂载下载的 dmg，替换 /Applications（或当前所在位置）里的
//!   `.app`，随后清除 quarantine 标记——优先用无密码的 `xattr -r -d`，仍带
//!   标记时弹终端运行 dmg 内自带的「修复启动损坏.command」（sudo 提权），等
//!   标记消失后再启动新版本。
//!
//! Windows 的换包与 macOS 的装包都在向导进程内完成：向导进程的映像即使被
//! 改名/删除（POSIX 语义）也继续运行，不受影响。

use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::fs;
use std::io::Write as _;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, WebviewUrl, WebviewWindow};

const RELEASE_API: &str = "https://api.github.com/repos/MogroWangStudio/Acta/releases/latest";
const USER_AGENT: &str = concat!("Acta-Updater/", env!("CARGO_PKG_VERSION"), " (+https://github.com/MogroWangStudio/Acta)");
pub const WIZARD_FLAG: &str = "--acta-update-wizard";
const UPDATE_DIR_NAME: &str = "acta-update";
const DOWNLOAD_EVENT: &str = "update://download";
const WIZARD_EVENT: &str = "update://wizard";
const REPAIR_SCRIPT_NAME: &str = "修复启动损坏.command";
/// 更换 Windows exe 时对杀软/索引器短暂锁文件的容忍重试。
#[cfg(target_os = "windows")]
const LOCK_RETRY_TIMES: usize = 6;
#[cfg(target_os = "windows")]
const LOCK_RETRY_DELAY: Duration = Duration::from_millis(400);
/// 修复脚本需要用户在终端里输入密码，等待标记消失的窗口放宽一些。
const REPAIR_WAIT: Duration = Duration::from_secs(180);

#[derive(Debug, Clone, Serialize)]
pub struct UpdateInfo {
    pub version: String,
    pub notes: String,
    pub asset_name: String,
    pub size: u64,
    pub url: String,
}

#[derive(Debug, Deserialize)]
struct ReleasePayload {
    tag_name: String,
    #[serde(default)]
    body: String,
    #[serde(default)]
    assets: Vec<ReleaseAsset>,
}

#[derive(Debug, Clone, Deserialize)]
struct ReleaseAsset {
    name: String,
    size: u64,
    browser_download_url: String,
}

/// 主应用 → 向导的安装任务单。target 在主应用侧就解析好：
/// Windows 为 exe 自身路径，macOS 为应被替换的 .app 包目录。
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateManifest {
    pub version: String,
    pub payload: PathBuf,
    pub target: PathBuf,
    pub pid: u32,
}

fn update_work_dir() -> PathBuf {
    std::env::temp_dir().join(UPDATE_DIR_NAME)
}

// ---- 版本比较 ----

/// "v3.2.1" / "3.2.1-beta.2" → (3, 2, 1)；解析失败返回 None（视为无更新）。
fn parse_version(tag: &str) -> Option<(u64, u64, u64)> {
    let core = tag
        .trim()
        .trim_start_matches(['v', 'V'])
        .split(['-', '+'])
        .next()?;
    let mut parts = core.split('.');
    let major = parts.next()?.parse().ok()?;
    let minor = parts.next()?.parse().ok()?;
    let patch = parts.next().unwrap_or("0").parse().ok()?;
    Some((major, minor, patch))
}

fn release_asset_filter(name: &str) -> bool {
    if cfg!(target_os = "macos") {
        name.ends_with("-macos-arm64.dmg")
    } else if cfg!(target_os = "windows") {
        name.ends_with("-windows-x64-portable.exe")
    } else {
        false
    }
}

fn pick_asset<'a>(assets: &'a [ReleaseAsset], version: &str) -> Option<&'a ReleaseAsset> {
    // 优先取与 tag 版本同名的资产，退而求其次取该平台的任意一个。
    assets
        .iter()
        .find(|asset| release_asset_filter(&asset.name) && asset.name.contains(version))
        .or_else(|| assets.iter().find(|asset| release_asset_filter(&asset.name)))
}

fn notes_preview(body: &str) -> String {
    let condensed: Vec<&str> = body
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .take(3)
        .collect();
    let text = condensed.join("；");
    if text.chars().count() > 160 {
        format!("{}…", text.chars().take(160).collect::<String>())
    } else {
        text
    }
}

async fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .connect_timeout(Duration::from_secs(10))
        .build()
        .map_err(|error| error.to_string())
}

// ---- 主应用侧入口（lib.rs 以 #[tauri::command] 薄包装后注册） ----

/// 查询 GitHub 最新 Release，比当前版本新才返回 Some。
pub async fn check_for_update(app: AppHandle) -> Result<Option<UpdateInfo>, String> {
    let version = app.package_info().version.clone();
    let current = (version.major, version.minor, version.patch);
    let response = http_client()
        .await?
        .get(RELEASE_API)
        .header("Accept", "application/vnd.github+json")
        .timeout(Duration::from_secs(15))
        .send()
        .await
        .map_err(|error| format!("无法连接 GitHub：{error}"))?;
    if !response.status().is_success() {
        return Err(format!("GitHub 返回了 {}", response.status()));
    }
    let release: ReleasePayload = response.json().await.map_err(|error| error.to_string())?;
    let candidate = match parse_version(&release.tag_name) {
        Some(candidate) => candidate,
        None => return Ok(None),
    };
    if candidate <= current {
        return Ok(None);
    }
    let asset = match pick_asset(&release.assets, &release.tag_name.trim_start_matches(['v', 'V'])) {
        Some(asset) => asset.clone(),
        None => return Err("新版本没有提供当前平台的安装包".into()),
    };
    Ok(Some(UpdateInfo {
        version: release.tag_name.trim_start_matches(['v', 'V']).to_string(),
        notes: notes_preview(&release.body),
        asset_name: asset.name,
        size: asset.size,
        url: asset.browser_download_url,
    }))
}

/// 流式下载更新包到临时目录，进度经 `update://download` 事件广播。
/// 若本地已有同名且同大小的完整文件（上次"稍后"留下的），直接复用。
pub async fn download_update(
    window: WebviewWindow,
    url: String,
    asset_name: String,
    expected_size: u64,
) -> Result<String, String> {
    let work_dir = update_work_dir();
    fs::create_dir_all(&work_dir).map_err(|error| error.to_string())?;
    let destination = work_dir.join(sanitize_asset_name(&asset_name)?);
    if destination.is_file() && fs::metadata(&destination).map(|meta| meta.len()).unwrap_or(0) == expected_size {
        return Ok(destination.to_string_lossy().into_owned());
    }

    let response = http_client()
        .await?
        .get(&url)
        .timeout(Duration::from_secs(30 * 60))
        .send()
        .await
        .map_err(|error| format!("下载失败：{error}"))?;
    if !response.status().is_success() {
        return Err(format!("下载失败：GitHub 返回 {}", response.status()));
    }
    let total = response.content_length().unwrap_or(expected_size);
    let mut stream = response.bytes_stream();
    let mut file = fs::File::create(&destination).map_err(|error| error.to_string())?;
    let mut received: u64 = 0;
    // 进度节流：总量 1% 或 256KB 起步，避免高频 IPC 拖慢下载。
    let mut next_report: u64 = total.div_ceil(100).max(256 * 1024);
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|error| format!("下载中断：{error}"))?;
        file.write_all(&chunk).map_err(|error| error.to_string())?;
        received += chunk.len() as u64;
        if received >= next_report || received == total {
            next_report = received + total.div_ceil(100).max(256 * 1024);
            let _ = window.emit(
                DOWNLOAD_EVENT,
                json!({ "received": received, "total": total, "percent": if total > 0 { received * 100 / total } else { 0 } }),
            );
        }
    }
    file.flush().map_err(|error| error.to_string())?;
    drop(file);
    if total > 0 && received != total {
        let _ = fs::remove_file(&destination);
        return Err("下载不完整，请重试".into());
    }
    Ok(destination.to_string_lossy().into_owned())
}

/// 检查下载文件名，防路径拼接意外（GitHub 资产名总是安全的，双保险）。
fn sanitize_asset_name(name: &str) -> Result<String, String> {
    let trimmed = name.trim();
    if trimmed.is_empty()
        || trimmed.contains('/')
        || trimmed.contains('\\')
        || trimmed.contains("..")
        || Path::new(trimmed).file_name().and_then(|value| value.to_str()) != Some(trimmed)
    {
        return Err("更新包文件名无效".into());
    }
    Ok(trimmed.to_string())
}

/// 写任务单并以向导模式拉起自身的第二个实例，随即由前端关闭主窗口。
pub async fn prepare_restart(payload: String, version: String) -> Result<bool, String> {
    let payload_path = PathBuf::from(&payload);
    if !payload_path.is_file() {
        return Err("更新包不存在，请重新下载".into());
    }
    let self_path = std::env::current_exe().map_err(|error| error.to_string())?;
    let target = resolve_update_target(&self_path)?;
    let manifest = UpdateManifest {
        version,
        payload: payload_path,
        target,
        pid: std::process::id(),
    };
    let work_dir = update_work_dir();
    fs::create_dir_all(&work_dir).map_err(|error| error.to_string())?;
    let manifest_path = work_dir.join("manifest.json");
    fs::write(&manifest_path, serde_json::to_string(&manifest).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())?;
    Command::new(&self_path)
        .arg(WIZARD_FLAG)
        .arg(&manifest_path)
        .spawn()
        .map_err(|error| format!("无法启动更新向导：{error}"))?;
    Ok(true)
}

/// 当前运行位置对应的更新目标：
/// - Windows：exe 自身；
/// - macOS：从 /Applications 或 ~/Applications 运行 → 原地替换；从 dmg 等
///   临时位置运行 → 作为全新安装落到 /Applications。
fn resolve_update_target(self_path: &Path) -> Result<PathBuf, String> {
    if cfg!(target_os = "windows") {
        return Ok(self_path.to_path_buf());
    }
    if cfg!(target_os = "macos") {
        let bundle = running_bundle(self_path).ok_or("无法定位当前应用包，请从「应用程序」文件夹运行更新")?;
        let parent = bundle.parent().map(Path::to_path_buf).unwrap_or_default();
        let home_applications = std::env::var("HOME").map(|home| PathBuf::from(home).join("Applications")).unwrap_or_default();
        if parent == PathBuf::from("/Applications") || (!home_applications.as_os_str().is_empty() && parent == home_applications) {
            return Ok(bundle);
        }
        return Ok(PathBuf::from("/Applications").join(bundle.file_name().ok_or("应用包名称无效")?));
    }
    Err("当前平台不支持应用内自动更新".into())
}

#[cfg(target_os = "macos")]
fn running_bundle(self_path: &Path) -> Option<PathBuf> {
    let mut ancestor = self_path.parent()?;
    loop {
        if ancestor.extension().and_then(|value| value.to_str()) == Some("app") {
            return Some(ancestor.to_path_buf());
        }
        ancestor = ancestor.parent()?;
    }
}

// ---- 更新向导 ----

/// 向导当前阶段，格式 "stage|message"；供向导页面加载后补齐错过的早期事件。
static WIZARD_STAGE: Mutex<String> = Mutex::new(String::new());

#[tauri::command]
fn wizard_stage() -> String {
    WIZARD_STAGE.lock().map(|stage| stage.clone()).unwrap_or_default()
}

fn set_stage(app: &AppHandle, stage: &str, message: &str) {
    if let Ok(mut guarded) = WIZARD_STAGE.lock() {
        *guarded = format!("{stage}|{message}");
    }
    let _ = app.emit(WIZARD_EVENT, json!({ "stage": stage, "message": message }));
}

/// 构建向导模式的应用：独立的小 Builder（配置里的主窗口 create:false，不会
/// 出现）。generate_context! 在 lib.rs 只展开一次，context 由那里传入。
pub fn build_wizard_app(context: tauri::Context<tauri::Wry>, manifest_path: PathBuf) -> tauri::App<tauri::Wry> {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![wizard_stage])
        .setup(move |app| {
            // 与主应用共用便携 WebView2 数据目录，避免向导又在系统 AppData
            // 里生成 EBWebView（同运行时版本下多进程共享是受支持的场景）。
            // （mut 仅 Windows 分支使用。）
            #[allow(unused_mut)]
            let mut window_builder = tauri::WebviewWindowBuilder::new(
                app,
                "updater",
                WebviewUrl::App("index.html".into()),
            )
            .title("Acta · 更新")
            .inner_size(440.0, 250.0)
            .resizable(false)
            .maximizable(false)
            .minimizable(false)
            .always_on_top(true)
            .center()
            .initialization_script("window.__ACTA_UPDATER__ = true;");
            #[cfg(target_os = "windows")]
            if let Some(portable) = crate::portable_data_dir() {
                if fs::create_dir_all(&portable).is_ok() {
                    window_builder = window_builder.data_directory(portable.join("webview"));
                }
            }
            window_builder.build()?;
            let handle = app.handle().clone();
            let manifest_for_worker = manifest_path.clone();
            std::thread::spawn(move || install_worker(handle, manifest_for_worker));
            Ok(())
        })
        .build(context)
        .expect("error while building Acta updater")
}

fn install_worker(app: AppHandle, manifest_path: PathBuf) {
    let manifest = fs::read_to_string(&manifest_path)
        .ok()
        .and_then(|raw| serde_json::from_str::<UpdateManifest>(&raw).ok());
    let Some(manifest) = manifest else {
        set_stage(&app, "error", "更新清单读取失败，请手动安装已下载的更新包。");
        return;
    };
    match install(&app, &manifest) {
        Ok(message) => {
            // 任务单、安装包与挂载残留都完成使命，一并清理；失败时保留供手动恢复。
            let _ = fs::remove_dir_all(update_work_dir());
            set_stage(&app, "done", &message);
            let handle = app.clone();
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(1500));
                handle.exit(0);
            });
        }
        Err(error) => set_stage(&app, "error", &error),
    }
}

fn install(app: &AppHandle, manifest: &UpdateManifest) -> Result<String, String> {
    set_stage(app, "wait", "等待应用退出…");
    wait_pid_exit(manifest.pid, Duration::from_secs(30));
    #[cfg(target_os = "windows")]
    return install_windows(app, manifest);
    #[cfg(target_os = "macos")]
    return install_macos(app, manifest);
    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    {
        let _ = app;
        Err("当前平台不支持应用内自动更新".into())
    }
}

fn wait_pid_exit(pid: u32, timeout: Duration) {
    let deadline = Instant::now() + timeout;
    while pid_alive(pid) {
        if Instant::now() >= deadline {
            return;
        }
        std::thread::sleep(Duration::from_millis(300));
    }
}

fn pid_alive(pid: u32) -> bool {
    #[cfg(target_os = "windows")]
    {
        Command::new("tasklist")
            .args(["/FI", &format!("PID eq {pid}"), "/NH"])
            .output()
            .map(|output| String::from_utf8_lossy(&output.stdout).to_lowercase().contains("acta"))
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("ps")
            .args(["-p", &pid.to_string()])
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }
}

fn run_command(program: &str, args: &[&str]) -> Result<(), String> {
    let output = Command::new(program).args(args).output().map_err(|error| error.to_string())?;
    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(if stderr.is_empty() { format!("{program} 退出码 {:?}", output.status.code()) } else { stderr })
    }
}

/// rename → 跨卷时回退 copy+delete。
#[cfg(target_os = "windows")]
fn move_file(from: &Path, to: &Path) -> Result<(), String> {
    match fs::rename(from, to) {
        Ok(()) => Ok(()),
        Err(rename_error) => fs::copy(from, to)
            .map(|_| ())
            .and_then(|_| fs::remove_file(from).map_err(|error| error))
            .map_err(|_| rename_error.to_string()),
    }
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

/// Windows：等待退出 → 运行中的 exe 改名为 *.acta-old → 新 exe 移回原路径 → 启动。
#[cfg(target_os = "windows")]
fn install_windows(app: &AppHandle, manifest: &UpdateManifest) -> Result<String, String> {
    set_stage(app, "install", "正在替换应用…");
    let target = &manifest.target;
    let backup = target.with_file_name(format!(
        "{}.acta-old",
        target.file_name().and_then(|name| name.to_str()).unwrap_or("Acta.exe")
    ));
    let _ = fs::remove_file(&backup);
    let mut rename_error = String::from("目标文件被占用");
    for _ in 0..LOCK_RETRY_TIMES {
        match fs::rename(target, &backup) {
            Ok(()) => {
                rename_error = String::new();
                break;
            }
            Err(error) => {
                rename_error = error.to_string();
                std::thread::sleep(LOCK_RETRY_DELAY);
            }
        }
    }
    if !rename_error.is_empty() {
        return Err(format!("无法替换应用文件（可能被占用）：{rename_error}"));
    }
    move_file(&manifest.payload, target).map_err(|error| format!("无法放置新版本：{error}"))?;
    set_stage(app, "launch", "正在启动新版本…");
    Command::new(target).spawn().map_err(|error| format!("无法启动新版本：{error}"))?;
    Ok("更新完成")
}

/// 新版本启动后清理上一次更新留下的旧 exe（向导进程退出前无法删除自己的映像）。
#[cfg(target_os = "windows")]
pub fn cleanup_stale_backup() {
    let Ok(self_path) = std::env::current_exe() else { return };
    let Some(file_name) = self_path.file_name().and_then(|name| name.to_str()) else { return };
    let backup = self_path.with_file_name(format!("{file_name}.acta-old"));
    for _ in 0..3 {
        match fs::remove_file(&backup) {
            Ok(()) => return,
            // 向导可能仍在收尾，稍等重试；仍失败就留给下次启动。
            Err(error) if error.kind() == std::io::ErrorKind::PermissionDenied => {
                std::thread::sleep(Duration::from_millis(500));
            }
            Err(_) => return,
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn cleanup_stale_backup() {}

/// macOS：挂载 dmg → 替换 .app → 清 quarantine（必要时弹终端跑修复脚本）→ 启动。
#[cfg(target_os = "macos")]
fn install_macos(app: &AppHandle, manifest: &UpdateManifest) -> Result<String, String> {
    let work_dir = update_work_dir();
    let mount = work_dir.join("mount");
    let _ = fs::remove_dir_all(&mount);
    fs::create_dir_all(&mount).map_err(|error| error.to_string())?;
    set_stage(app, "install", "正在挂载更新包…");
    let mount_arg = mount.to_string_lossy().into_owned();
    let payload_arg = manifest.payload.to_string_lossy().into_owned();
    run_command(
        "hdiutil",
        &["attach", "-nobrowse", "-readonly", "-mountpoint", mount_arg.as_str(), payload_arg.as_str()],
    )
    .map_err(|error| format!("无法挂载更新包：{error}"))?;

    let source_app = find_mounted_app(&mount).ok_or("更新包里没有找到应用")?;
    // 修复脚本必须在卸载前拷出来。
    let repair_script = {
        let candidate = mount.join(REPAIR_SCRIPT_NAME);
        if candidate.is_file() {
            let destination = work_dir.join(REPAIR_SCRIPT_NAME);
            let _ = fs::copy(&candidate, &destination);
            destination.is_file().then_some(destination)
        } else {
            None
        }
    };

    set_stage(app, "install", "正在安装新版本…");
    install_bundle(app, &source_app, &manifest.target)?;

    // 卸载尽力而为；失败不影响已完成的安装。
    let mount_arg = mount.to_string_lossy().into_owned();
    for _ in 0..3 {
        if run_command("hdiutil", &["detach", mount_arg.as_str()]).is_ok() {
            break;
        }
        std::thread::sleep(Duration::from_millis(600));
    }
    if mount.is_dir() {
        let _ = run_command("hdiutil", &["detach", "-force", mount_arg.as_str()]);
    }

    set_stage(app, "repair", "正在清除隔离标记…");
    let mut message = "更新完成".to_string();
    if !clear_quarantine(&manifest.target) {
        // 无密码清理失败（例如文件归 root 所有）→ 弹终端运行 dmg 自带的修复脚本。
        match repair_script {
            Some(script) => {
                let script_arg = script.to_string_lossy().into_owned();
                let _ = run_command("/usr/bin/xattr", &["-d", "com.apple.quarantine", script_arg.as_str()]);
                use std::os::unix::fs::PermissionsExt;
                let _ = fs::set_permissions(&script, fs::Permissions::from_mode(0o755));
                match Command::new("/usr/bin/open").arg(&script).spawn() {
                    Ok(_) => {
                        set_stage(app, "repair", "请在弹出的终端窗口中输入密码完成修复…");
                        if !wait_quarantine_cleared(&manifest.target, REPAIR_WAIT) {
                            message = "修复脚本未完成，新版本可能无法启动；请稍后手动运行修复脚本。".into();
                        }
                    }
                    Err(error) => {
                        message = format!("无法打开修复脚本（{error}），请手动运行 dmg 里的修复脚本。");
                    }
                }
            }
            None => message = "更新包内没有修复脚本，新版本可能无法启动；请手动清除隔离标记。".into(),
        }
    }

    set_stage(app, "launch", "正在启动新版本…");
    let launch = format!("sleep 1; open {}", shell_quote(&manifest.target.to_string_lossy()));
    Command::new("/bin/sh")
        .arg("-c")
        .arg(&launch)
        .spawn()
        .map_err(|error| format!("无法启动新版本：{error}"))?;
    Ok(message)
}

#[cfg(target_os = "macos")]
fn find_mounted_app(mount: &Path) -> Option<PathBuf> {
    let mut found = None;
    let entries = fs::read_dir(mount).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() && path.extension().and_then(|value| value.to_str()) == Some("app") {
            found = Some(path);
            break;
        }
    }
    found
}

/// 替换 .app：用户身份的 rm+cp 通常足够（拖拽安装的应用归用户所有）；
/// 权限不足时走 osascript 管理员授权（系统原生密码框）。
#[cfg(target_os = "macos")]
fn install_bundle(app: &AppHandle, source_app: &Path, target: &Path) -> Result<(), String> {
    let source = source_app.to_string_lossy().into_owned();
    let destination = target.to_string_lossy().into_owned();
    let remove = run_command("/bin/rm", &["-rf", &destination]);
    let copy = run_command("/bin/cp", &["-R", &source, &destination]);
    match (remove, copy) {
        (Ok(()), Ok(())) if target.is_dir() => Ok(()),
        _ => {
            set_stage(app, "install", "需要管理员权限完成安装，请在弹窗中确认…");
            let script = format!("rm -rf {destination} && cp -R {source} {destination}");
            let apple_script = format!("do shell script \"{}\" with administrator privileges", script);
            let output = Command::new("osascript")
                .args(["-e", &apple_script])
                .output()
                .map_err(|error| error.to_string())?;
            if output.status.success() && target.is_dir() {
                Ok(())
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
                Err(if stderr.is_empty() { "安装新版本失败".into() } else { stderr })
            }
        }
    }
}

#[cfg(target_os = "macos")]
fn quarantine_present(target: &Path) -> bool {
    let target_arg = target.to_string_lossy().into_owned();
    Command::new("/usr/bin/xattr")
        .args(["-p", "com.apple.quarantine", target_arg.as_str()])
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// 清除 quarantine。先静默 `xattr -r -d`（拖拽安装的应用归用户所有，无需密码）；
/// 返回是否已彻底清除。
#[cfg(target_os = "macos")]
fn clear_quarantine(target: &Path) -> bool {
    let target_arg = target.to_string_lossy().into_owned();
    let _ = run_command("/usr/bin/xattr", &["-r", "-d", "com.apple.quarantine", target_arg.as_str()]);
    !quarantine_present(target)
}

#[cfg(target_os = "macos")]
fn wait_quarantine_cleared(target: &Path, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    while quarantine_present(target) {
        if Instant::now() >= deadline {
            return false;
        }
        std::thread::sleep(Duration::from_millis(1000));
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_tags() {
        assert_eq!(parse_version("v3.2.1"), Some((3, 2, 1)));
        assert_eq!(parse_version("3.10.0"), Some((3, 10, 0)));
        assert_eq!(parse_version("v3.3.0-beta.1"), Some((3, 3, 0)));
        assert_eq!(parse_version("release-42"), None);
    }

    #[test]
    fn compares_versions() {
        assert!(parse_version("v3.2.1").unwrap() > parse_version("v3.2.0").unwrap());
        assert!(parse_version("v3.2.0").unwrap() <= parse_version("v3.2.0").unwrap());
    }

    #[test]
    fn sanitizes_names() {
        assert!(sanitize_asset_name("Acta-3.3.0-macos-arm64.dmg").is_ok());
        assert!(sanitize_asset_name("../evil.dmg").is_err());
        assert!(sanitize_asset_name("").is_err());
        assert!(sanitize_asset_name("a/b.dmg").is_err());
    }
}
