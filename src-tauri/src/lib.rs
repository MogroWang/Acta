use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use chrono::{SecondsFormat, Utc};
use reqwest::{
    header::{HeaderMap, HeaderName, HeaderValue},
    redirect::Policy,
    Method,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::{
    collections::{HashMap, HashSet},
    fs,
    io::{self, ErrorKind},
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager, WebviewWindow};
use url::Url;

mod updater;

// 自更新命令的薄包装：#[tauri::command] 的隐藏宏留在 lib.rs 作用域，
// 避免 generate_handler! 跨模块引用私有宏的可见性问题。
#[tauri::command]
async fn check_app_update(app: AppHandle) -> Result<Option<updater::UpdateInfo>, String> {
    updater::check_for_update(app).await
}

#[tauri::command]
async fn download_app_update(
    window: WebviewWindow,
    url: String,
    asset_name: String,
    expected_size: u64,
) -> Result<String, String> {
    updater::download_update(window, url, asset_name, expected_size).await
}

#[tauri::command]
async fn prepare_update_restart(payload: String, version: String) -> Result<bool, String> {
    updater::prepare_restart(payload, version).await
}

const SYNC_FILE: &str = "acta-library.json";
const DATA_MANIFEST_FILE: &str = "acta-manifest.json";
const CLASSIFICATIONS_FILE: &str = "classifications.json";
const NOTES_DIRECTORY: &str = "notes";
const TODOS_DIRECTORY: &str = "todos";
const NOTE_SIZE_LIMIT: u64 = 5 * 1024 * 1024;
const WEBDAV_SIZE_LIMIT: usize = 16 * 1024 * 1024;
const EXPORT_FILE_LIMIT: usize = 64 * 1024 * 1024;
const EXPORT_TOTAL_LIMIT: usize = 192 * 1024 * 1024;
const APP_ICON_FILE: &str = "app-icon.png";
const THEME_COLOR_FILE: &str = "theme-color.txt";
const DEFAULT_SIDEBAR_COLOR: &str = "#ebe7dc";
const WINDOW_STATE_FILE: &str = "window-state.json";
const APP_DATA_DIR_FILE: &str = "app-data-dir.txt";
const APP_DATA_SETTINGS_FILE: &str = "settings.json";
const APP_DATA_MARKER_FILE: &str = ".acta-app-data";
/// Keep at least this much of the restored window inside a monitor, so a
/// stale/off-screen saved rect can never strand the window out of view.
const WINDOW_VISIBILITY_MARGIN_PX: i64 = 120;

fn timestamp() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

fn io_invalid(message: impl Into<String>) -> io::Error {
    io::Error::new(ErrorKind::InvalidData, message.into())
}

fn read_json(path: &Path) -> io::Result<Value> {
    let raw = fs::read_to_string(path)?;
    serde_json::from_str(&raw).map_err(|error| io_invalid(error.to_string()))
}

fn write_json(path: &Path, value: &Value) -> Result<(), String> {
    let content = serde_json::to_string_pretty(value).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())
}

fn safe_data_item_file_name(value: &str, allowed_extensions: &[&str]) -> Result<String, String> {
    let path = Path::new(value);
    if value.is_empty() || path.file_name().and_then(|name| name.to_str()) != Some(value) {
        return Err("数据档案包含无效的项目文件名".into());
    }
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    let stem = path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or_default();
    let item_id = stem.strip_prefix("item-").unwrap_or_default();
    if item_id.is_empty()
        || !item_id.chars().all(|character| character.is_ascii_hexdigit())
        || !allowed_extensions.contains(&extension.as_str())
    {
        return Err("数据档案包含无效的项目文件名".into());
    }
    Ok(value.to_owned())
}

fn write_data_file(path: &Path, value: &Value) -> Result<(), String> {
    if let Some(content) = value.as_str() {
        fs::write(path, content).map_err(|error| error.to_string())
    } else {
        write_json(path, value)
    }
}

fn remove_stale_item_files(directory: &Path, expected_files: &HashSet<String>) -> Result<(), String> {
    for entry in fs::read_dir(directory).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        if !entry
            .file_type()
            .map_err(|error| error.to_string())?
            .is_file()
        {
            continue;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        let recognized = safe_data_item_file_name(&name, &["json", "md"]).is_ok();
        if recognized && !expected_files.contains(&name) {
            fs::remove_file(entry.path()).map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

fn object_file<'a>(files: &'a Map<String, Value>, name: &str) -> Result<&'a Value, String> {
    files
        .get(name)
        .ok_or_else(|| "这不是有效的 Acta V3 完整数据档案".to_string())
}

fn write_portable_data_folder(folder: &Path, bundle: &Value) -> Result<(), String> {
    let files = bundle
        .get("files")
        .and_then(Value::as_object)
        .ok_or_else(|| "这不是有效的 Acta V3 完整数据档案".to_string())?;
    let manifest = object_file(files, DATA_MANIFEST_FILE)?;
    let classifications = object_file(files, CLASSIFICATIONS_FILE)?;
    let valid = bundle.get("format").and_then(Value::as_str) == Some("acta-data-folder-bundle")
        && bundle.get("version").and_then(Value::as_u64) == Some(3)
        && manifest.get("format").and_then(Value::as_str) == Some("acta-data-folder")
        && manifest.get("version").and_then(Value::as_u64) == Some(3)
        && manifest.get("classifications").and_then(Value::as_str) == Some(CLASSIFICATIONS_FILE)
        && classifications.get("format").and_then(Value::as_str) == Some("acta-classifications")
        && classifications.get("version").and_then(Value::as_u64) == Some(1)
        && classifications.get("folders").and_then(Value::as_array).is_some();
    if !valid {
        return Err("这不是有效的 Acta V3 完整数据档案".into());
    }

    let notes = files
        .get(NOTES_DIRECTORY)
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    let todos = files
        .get(TODOS_DIRECTORY)
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    let notes_path = folder.join(NOTES_DIRECTORY);
    let todos_path = folder.join(TODOS_DIRECTORY);
    fs::create_dir_all(&notes_path).map_err(|error| error.to_string())?;
    fs::create_dir_all(&todos_path).map_err(|error| error.to_string())?;

    let mut note_files = HashSet::new();
    for (name, document) in &notes {
        let name = safe_data_item_file_name(name, &["json", "md"])?;
        write_data_file(&notes_path.join(&name), document)?;
        note_files.insert(name);
    }
    let mut todo_files = HashSet::new();
    for (name, document) in &todos {
        let name = safe_data_item_file_name(name, &["json"])?;
        write_json(&todos_path.join(&name), document)?;
        todo_files.insert(name);
    }

    write_json(&folder.join(CLASSIFICATIONS_FILE), classifications)?;
    // The manifest is written last so readers never observe a partially written bundle.
    write_json(&folder.join(DATA_MANIFEST_FILE), manifest)?;
    remove_stale_item_files(&notes_path, &note_files)?;
    remove_stale_item_files(&todos_path, &todo_files)?;
    match fs::remove_file(folder.join(SYNC_FILE)) {
        Ok(()) => {}
        Err(error) if error.kind() == ErrorKind::NotFound => {}
        Err(error) => return Err(error.to_string()),
    }
    Ok(())
}

fn read_json_item(folder: &Path, directory: &str, file: &str) -> io::Result<(String, Value)> {
    let name = safe_data_item_file_name(file, &["json"]).map_err(io_invalid)?;
    let value = read_json(&folder.join(directory).join(&name))?;
    Ok((name, value))
}

fn read_portable_data_folder(folder: &Path) -> io::Result<Value> {
    let manifest = read_json(&folder.join(DATA_MANIFEST_FILE))?;
    if manifest.get("format").and_then(Value::as_str) != Some("acta-data-folder") {
        return Err(io_invalid("这不是有效的 Acta 完整数据档案"));
    }
    let classifications_path = manifest
        .get("classifications")
        .and_then(Value::as_str)
        .unwrap_or(CLASSIFICATIONS_FILE);
    if Path::new(classifications_path)
        .file_name()
        .and_then(|name| name.to_str())
        != Some(classifications_path)
    {
        return Err(io_invalid("数据档案包含无效的归类文件路径"));
    }
    let classifications = read_json(&folder.join(classifications_path))?;

    let mut notes = Map::new();
    let note_entries = manifest
        .get("notes")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    for entry in note_entries {
        if let (Some(config), Some(markdown)) = (
            entry.get("config").and_then(Value::as_str),
            entry.get("markdown").and_then(Value::as_str),
        ) {
            let config_name = safe_data_item_file_name(config, &["json"]).map_err(io_invalid)?;
            let markdown_name =
                safe_data_item_file_name(markdown, &["md"]).map_err(io_invalid)?;
            notes.insert(
                config_name.clone(),
                read_json(&folder.join(NOTES_DIRECTORY).join(&config_name))?,
            );
            notes.insert(
                markdown_name.clone(),
                Value::String(fs::read_to_string(
                    folder.join(NOTES_DIRECTORY).join(&markdown_name),
                )?),
            );
        } else {
            let file = entry
                .get("file")
                .and_then(Value::as_str)
                .ok_or_else(|| io_invalid("数据档案包含无效的笔记文件"))?;
            let (name, value) = read_json_item(folder, NOTES_DIRECTORY, file)?;
            notes.insert(name, value);
        }
    }

    let mut todos = Map::new();
    let todo_entries = manifest
        .get("todos")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    for entry in todo_entries {
        let file = entry
            .get("file")
            .and_then(Value::as_str)
            .ok_or_else(|| io_invalid("数据档案包含无效的待办文件"))?;
        let (name, value) = read_json_item(folder, TODOS_DIRECTORY, file)?;
        todos.insert(name, value);
    }

    let version = if manifest.get("version").and_then(Value::as_u64).unwrap_or(2) >= 3 {
        3
    } else {
        2
    };
    let mut files = Map::new();
    files.insert(DATA_MANIFEST_FILE.into(), manifest);
    files.insert(CLASSIFICATIONS_FILE.into(), classifications);
    files.insert(NOTES_DIRECTORY.into(), Value::Object(notes));
    files.insert(TODOS_DIRECTORY.into(), Value::Object(todos));
    Ok(json!({
        "format": "acta-data-folder-bundle",
        "version": version,
        "files": files
    }))
}

fn require_folder(folder: String) -> Result<PathBuf, String> {
    let trimmed = folder.trim();
    if trimmed.is_empty() {
        return Err("未选择同步文件夹".into());
    }
    let path = PathBuf::from(trimmed);
    if !path.is_dir() {
        return Err("同步文件夹不存在或无法访问".into());
    }
    Ok(path)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SyncResult {
    path: String,
    synced_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadResult {
    library: Value,
    synced_at: Option<String>,
    path: String,
}

#[tauri::command]
async fn upload_library(folder: String, library: Value) -> Result<SyncResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let folder = require_folder(folder)?;
        let synced_at = timestamp();
        if library.get("format").and_then(Value::as_str) == Some("acta-data-folder-bundle") {
            write_portable_data_folder(&folder, &library)?;
            return Ok(SyncResult {
                path: folder.to_string_lossy().into_owned(),
                synced_at,
            });
        }

        let target = folder.join(SYNC_FILE);
        write_json(
            &target,
            &json!({
                "format": "acta-library",
                "version": 1,
                "syncedAt": synced_at,
                "library": library
            }),
        )?;
        Ok(SyncResult {
            path: target.to_string_lossy().into_owned(),
            synced_at,
        })
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
async fn download_library(folder: String) -> Result<DownloadResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let folder = require_folder(folder)?;
        match read_portable_data_folder(&folder) {
            Ok(library) => {
                return Ok(DownloadResult {
                    library,
                    synced_at: Some(timestamp()),
                    path: folder.to_string_lossy().into_owned(),
                })
            }
            Err(error) if error.kind() == ErrorKind::NotFound => {}
            Err(error) => return Err(error.to_string()),
        }

        let target = folder.join(SYNC_FILE);
        let parsed = read_json(&target).map_err(|error| error.to_string())?;
        if parsed.get("format").and_then(Value::as_str) != Some("acta-library")
            || parsed.get("library").is_none()
        {
            return Err("这不是有效的 Acta 数据文件".into());
        }
        Ok(DownloadResult {
            library: parsed.get("library").cloned().unwrap_or(Value::Null),
            synced_at: parsed
                .get("syncedAt")
                .and_then(Value::as_str)
                .map(str::to_owned),
            path: target.to_string_lossy().into_owned(),
        })
    })
    .await
    .map_err(|error| error.to_string())?
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FolderInspection {
    empty: bool,
    has_acta_data: bool,
    sample: Vec<String>,
}

#[tauri::command]
async fn inspect_folder(folder: String) -> Result<FolderInspection, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let folder = require_folder(folder)?;
        let mut sample = Vec::new();
        let mut has_acta_data = false;
        let mut empty = true;
        for entry in fs::read_dir(&folder).map_err(|error| error.to_string())? {
            let entry = entry.map_err(|error| error.to_string())?;
            empty = false;
            let name = entry.file_name().to_string_lossy().into_owned();
            if name == DATA_MANIFEST_FILE || name == SYNC_FILE {
                has_acta_data = true;
            }
            if sample.len() < 20 {
                sample.push(name);
            }
        }
        Ok(FolderInspection {
            empty,
            has_acta_data,
            sample,
        })
    })
    .await
    .map_err(|error| error.to_string())?
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DataFolderStats {
    total_bytes: u64,
    file_count: u64,
    note_count: u64,
    todo_count: u64,
}

#[tauri::command]
async fn data_folder_stats(folder: String) -> Result<DataFolderStats, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let folder = require_folder(folder)?;
        fn walk(dir: &Path, total_bytes: &mut u64, file_count: &mut u64) -> io::Result<()> {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let metadata = entry.metadata()?;
                if metadata.is_dir() {
                    walk(&entry.path(), total_bytes, file_count)?;
                } else {
                    *total_bytes += metadata.len();
                    *file_count += 1;
                }
            }
            Ok(())
        }
        let mut stats = DataFolderStats {
            total_bytes: 0,
            file_count: 0,
            note_count: 0,
            todo_count: 0,
        };
        walk(&folder, &mut stats.total_bytes, &mut stats.file_count)
            .map_err(|error| error.to_string())?;
        // 条目计数以 manifest 索引为准，读不到时保持 0，让前端回退用内存数据展示。
        if let Ok(content) = fs::read_to_string(folder.join(DATA_MANIFEST_FILE)) {
            if let Ok(value) = serde_json::from_str::<Value>(&content) {
                stats.note_count = value
                    .get("notes")
                    .and_then(Value::as_array)
                    .map(|entries| entries.len() as u64)
                    .unwrap_or(0);
                stats.todo_count = value
                    .get("todos")
                    .and_then(Value::as_array)
                    .map(|entries| entries.len() as u64)
                    .unwrap_or(0);
            }
        }
        Ok(stats)
    })
    .await
    .map_err(|error| error.to_string())?
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WebDavOptions {
    method: Option<String>,
    #[serde(default)]
    headers: HashMap<String, String>,
    body: Option<String>,
}

#[derive(Serialize)]
struct WebDavResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: String,
}

#[tauri::command]
async fn web_dav_request(
    request_url: String,
    request_options: Option<WebDavOptions>,
) -> Result<WebDavResponse, String> {
    let target = Url::parse(&request_url).map_err(|_| "WebDAV 地址无效".to_string())?;
    if !matches!(target.scheme(), "http" | "https") {
        return Err("WebDAV 仅支持 HTTP 或 HTTPS 地址".into());
    }
    let request_options = request_options.unwrap_or_default();
    let method_name = request_options
        .method
        .as_deref()
        .unwrap_or("GET")
        .to_ascii_uppercase();
    if !["GET", "HEAD", "PUT", "DELETE", "PROPFIND", "MKCOL"].contains(&method_name.as_str()) {
        return Err("不支持的 WebDAV 请求方法".into());
    }
    let method = Method::from_bytes(method_name.as_bytes()).map_err(|error| error.to_string())?;
    let mut headers = HeaderMap::new();
    for (name, value) in request_options.headers {
        let normalized = name.to_ascii_lowercase();
        if !["authorization", "accept", "content-type", "depth"].contains(&normalized.as_str()) {
            continue;
        }
        let header_name =
            HeaderName::from_bytes(normalized.as_bytes()).map_err(|error| error.to_string())?;
        let header_value = HeaderValue::from_str(&value).map_err(|error| error.to_string())?;
        headers.insert(header_name, header_value);
    }
    if request_options
        .body
        .as_ref()
        .is_some_and(|body| body.len() > WEBDAV_SIZE_LIMIT)
    {
        return Err("单个 WebDAV 文件不能超过 16 MB".into());
    }

    let client = reqwest::Client::builder()
        .redirect(Policy::limited(10))
        .build()
        .map_err(|error| error.to_string())?;
    let mut request = client.request(method.clone(), target).headers(headers);
    if let Some(body) = request_options.body {
        request = request.body(body);
    }
    let response = request
        .send()
        .await
        .map_err(|error| format!("WebDAV 网络请求失败：{error}"))?;
    let status = response.status().as_u16();
    let response_headers = response
        .headers()
        .iter()
        .filter_map(|(name, value)| {
            value
                .to_str()
                .ok()
                .map(|value| (name.to_string(), value.to_string()))
        })
        .collect();
    let body = if method == Method::HEAD {
        String::new()
    } else {
        response
            .text()
            .await
            .map_err(|error| format!("WebDAV 响应读取失败：{error}"))?
    };
    Ok(WebDavResponse {
        status,
        headers: response_headers,
        body,
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ImportedNote {
    content: String,
    file_name: String,
    path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ExportedFile {
    file_name: String,
    path: String,
}

#[tauri::command]
async fn import_note(path: String) -> Result<ImportedNote, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let path = PathBuf::from(path);
        let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
        if !metadata.is_file() {
            return Err("请选择一个笔记文件".into());
        }
        if metadata.len() > NOTE_SIZE_LIMIT {
            return Err("文件不能超过 5 MB".into());
        }
        let file_name = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("note.md")
            .to_string();
        let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
        Ok(ImportedNote {
            content,
            file_name,
            path: path.to_string_lossy().into_owned(),
        })
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
async fn export_note(path: String, content: String) -> Result<ExportedFile, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if content.len() > NOTE_SIZE_LIMIT as usize {
            return Err("文件不能超过 5 MB".into());
        }
        let mut path = PathBuf::from(path);
        path.set_extension("md");
        fs::write(&path, content).map_err(|error| error.to_string())?;
        Ok(ExportedFile {
            file_name: path
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("note.md")
                .to_string(),
            path: path.to_string_lossy().into_owned(),
        })
    })
    .await
    .map_err(|error| error.to_string())?
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportAsset {
    file_name: String,
    mime_type: String,
    data_url: String,
}

struct DecodedAsset {
    file_name: String,
    extension: &'static str,
    bytes: Vec<u8>,
}

fn sanitize_file_stem(file_name: &str) -> String {
    let path = Path::new(file_name);
    let raw = path
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or("行记笔记");
    let sanitized: String = raw
        .chars()
        .map(|character| {
            if character.is_control() || "<>:\"/\\|?*".contains(character) {
                '_'
            } else {
                character
            }
        })
        .collect();
    let sanitized = sanitized.trim();
    if sanitized.is_empty() {
        "行记笔记".into()
    } else {
        sanitized.into()
    }
}

fn decode_export_asset(asset: ExportAsset) -> Result<DecodedAsset, String> {
    let extension = match asset.mime_type.as_str() {
        "application/pdf" => "pdf",
        "image/png" => "png",
        "image/jpeg" => "jpg",
        _ => return Err("不支持该导出格式".into()),
    };
    let prefix = format!("data:{};base64,", asset.mime_type);
    let encoded = asset
        .data_url
        .strip_prefix(&prefix)
        .ok_or_else(|| "导出文件数据无效".to_string())?;
    let encoded: String = encoded
        .chars()
        .filter(|character| !character.is_whitespace())
        .collect();
    let bytes = BASE64
        .decode(encoded)
        .map_err(|_| "导出文件数据无效".to_string())?;
    if bytes.is_empty() || bytes.len() > EXPORT_FILE_LIMIT {
        return Err("单个导出文件不能超过 64 MB".into());
    }
    Ok(DecodedAsset {
        file_name: format!("{}.{}", sanitize_file_stem(&asset.file_name), extension),
        extension,
        bytes,
    })
}

fn available_export_path(directory: &Path, file_name: &str) -> Result<PathBuf, String> {
    let path = Path::new(file_name);
    let stem = path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("行记笔记");
    let extension = path.extension().and_then(|value| value.to_str()).unwrap_or("");
    for suffix in 0..10_000 {
        let name = if suffix == 0 {
            file_name.to_string()
        } else {
            format!("{stem}-{}.{}", suffix + 1, extension)
        };
        let candidate = directory.join(name);
        if !candidate.exists() {
            return Ok(candidate);
        }
    }
    Err("无法生成可用的导出文件名".into())
}

#[tauri::command]
async fn export_assets(
    destination: String,
    assets: Vec<ExportAsset>,
    directory: bool,
) -> Result<Vec<ExportedFile>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if assets.is_empty() || assets.len() > 100 {
            return Err("导出文件数量无效".into());
        }
        let decoded = assets
            .into_iter()
            .map(decode_export_asset)
            .collect::<Result<Vec<_>, _>>()?;
        if decoded.iter().map(|asset| asset.bytes.len()).sum::<usize>() > EXPORT_TOTAL_LIMIT {
            return Err("本次导出内容不能超过 192 MB".into());
        }
        let destination = PathBuf::from(destination);
        let mut exported = Vec::with_capacity(decoded.len());
        if directory {
            if !destination.is_dir() {
                return Err("导出文件夹不存在或无法访问".into());
            }
            for asset in decoded {
                let path = available_export_path(&destination, &asset.file_name)?;
                fs::write(&path, asset.bytes).map_err(|error| error.to_string())?;
                exported.push(ExportedFile {
                    file_name: path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .unwrap_or(&asset.file_name)
                        .to_string(),
                    path: path.to_string_lossy().into_owned(),
                });
            }
        } else {
            let asset = decoded
                .into_iter()
                .next()
                .ok_or_else(|| "导出文件数量无效".to_string())?;
            let mut path = destination;
            path.set_extension(asset.extension);
            fs::write(&path, asset.bytes).map_err(|error| error.to_string())?;
            exported.push(ExportedFile {
                file_name: path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or(&asset.file_name)
                    .to_string(),
                path: path.to_string_lossy().into_owned(),
            });
        }
        Ok(exported)
    })
    .await
    .map_err(|error| error.to_string())?
}

fn decode_app_icon(data_url: &str) -> Result<Vec<u8>, String> {
    if data_url.len() > 3 * 1024 * 1024 {
        return Err("应用图标数据无效".into());
    }
    if data_url.is_empty() {
        return Ok(include_bytes!("../icons/icon.png").to_vec());
    }
    let encoded = data_url
        .strip_prefix("data:image/png;base64,")
        .ok_or_else(|| "应用图标数据无效".to_string())?;
    BASE64
        .decode(encoded)
        .map_err(|_| "应用图标数据无效".to_string())
}

/// 打包进二进制的预设图标（与前端 public/icons 的预设一一对应）。桌面 webview 的
/// 画布管线在个别环境下不可用（CSP、协议染色等），此时前端发送空 dataURL +
/// 预设名，由 Rust 侧用这份内置资产兜底应用并持久化。
fn app_icon_preset_bytes(preset: &str) -> Option<&'static [u8]> {
    #[cfg(target_os = "macos")]
    if macos_version_major().unwrap_or(0) >= 26 {
        // macOS 26+ 与前端保持一致：走烘焙了系统 squircle 的专属版本
        // （scripts/generate-macos26-icons.mjs 生成），运行时不再依赖
        // 系统遮罩（运行时设置的 Dock 图标没有系统遮罩）。
        let masked: Option<&'static [u8]> = match preset {
            "default" => Some(include_bytes!("../../public/icons/macos26/default.png").as_slice()),
            "positive" => Some(include_bytes!("../../public/icons/macos26/positive.png").as_slice()),
            "outline" => Some(include_bytes!("../../public/icons/macos26/outline.png").as_slice()),
            "original" => Some(include_bytes!("../../public/icons/macos26/original.png").as_slice()),
            _ => None,
        };
        if masked.is_some() {
            return masked;
        }
    }
    match preset {
        // "default" 用打包 macOS 图标同一份 full-bleed 资产：无透明边距、
        // 无烘焙圆角，Windows 的原样显示与 macOS 26 以下的居中留边都以此
        // 为基准。icon-512.png 是 PWA 图标（自带圆角，manifest 的 "any"
        // 尺寸继续引用），不能作桌面预设源。
        "default" => Some(include_bytes!("../../public/icons/icon-512-square.png").as_slice()),
        "positive" => Some(include_bytes!("../../public/icons/app-icon-positive-page.png").as_slice()),
        "outline" => Some(include_bytes!("../../public/icons/app-icon-outlined-page.png").as_slice()),
        "original" => Some(include_bytes!("../../public/icons/app-icon-original-simple.png").as_slice()),
        _ => None,
    }
}

/// 软件自身配置（主题色、应用图标、窗口状态）所在目录：跟随解析出的软件
/// 数据文件夹——便携版即 exe 旁的 data，不再落入系统 AppData；解析失败
/// （如 exe 目录只读且无记录）才回退系统 AppData。
fn software_config_dir(app: &AppHandle) -> PathBuf {
    resolve_app_data_path(app)
        .ok()
        .flatten()
        .unwrap_or_else(|| app.path().app_data_dir().unwrap_or_default())
}

/// 3.2.x 及之前主题色/应用图标/窗口状态/设置镜像固定写在系统 AppData，与
/// "数据跟着程序走"的便携语义相悖；启动时把它们迁到当前配置目录（可移动
/// 则移动，跨卷时退化为复制后删除源文件）。
fn migrate_legacy_config_files(app: &AppHandle) {
    let system_dir = app.path().app_data_dir().unwrap_or_default();
    let target_dir = software_config_dir(app);
    if system_dir.as_os_str().is_empty() || system_dir == target_dir {
        return;
    }
    for file_name in [APP_ICON_FILE, THEME_COLOR_FILE, WINDOW_STATE_FILE, APP_DATA_SETTINGS_FILE] {
        let from = system_dir.join(file_name);
        let to = target_dir.join(file_name);
        if from.is_file() && !to.exists() {
            if fs::rename(&from, &to).is_err() {
                if fs::copy(&from, &to).is_ok() {
                    let _ = fs::remove_file(&from);
                }
            }
        }
    }
}

fn persisted_app_icon_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(software_config_dir(app).join(APP_ICON_FILE))
}

fn persisted_theme_color_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(software_config_dir(app).join(THEME_COLOR_FILE))
}

fn parse_theme_color(raw: &str) -> Option<tauri::window::Color> {
    let hex = raw.trim().strip_prefix('#')?;
    if hex.len() != 6 || !hex.chars().all(|character| character.is_ascii_hexdigit()) {
        return None;
    }
    let channel = |range: std::ops::Range<usize>| u8::from_str_radix(&hex[range], 16).ok();
    Some(tauri::window::Color(channel(0..2)?, channel(2..4)?, channel(4..6)?, 255))
}

#[derive(Serialize, Deserialize, Clone, Copy)]
struct WindowState {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    maximized: bool,
}

/// Last observed geometry, kept in memory so any exit path (close button,
/// Cmd+Q, app exit) can flush the most recent position and size to disk.
static WINDOW_STATE_CACHE: std::sync::Mutex<Option<WindowState>> = std::sync::Mutex::new(None);

fn persisted_window_state_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(software_config_dir(app).join(WINDOW_STATE_FILE))
}

fn snapshot_window_state(window: &WebviewWindow) -> Option<WindowState> {
    let position = window.outer_position().ok()?;
    let size = window.outer_size().ok()?;
    Some(WindowState {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        maximized: window.is_maximized().unwrap_or(false),
    })
}

fn persist_window_state(app: &AppHandle, state: Option<WindowState>) {
    let Ok(path) = persisted_window_state_path(app) else { return };
    let Some(state) = state else { return };
    if let Some(directory) = path.parent() {
        let _ = fs::create_dir_all(directory);
    }
    if let Ok(json) = serde_json::to_string_pretty(&state) {
        let _ = fs::write(path, json);
    }
}

fn flush_window_state(app: &AppHandle) {
    let live_state = app.get_webview_window("main").and_then(|window| snapshot_window_state(&window));
    let state = live_state.or_else(|| WINDOW_STATE_CACHE.lock().ok().and_then(|guarded| *guarded));
    persist_window_state(app, state);
}

/// Restores the last window geometry, but only if the saved rect still keeps a
/// healthy chunk inside one of the current monitors - otherwise fall back to
/// the platform default placement instead of a window stranded off-screen.
fn load_window_state(app: &AppHandle) -> Option<WindowState> {
    let raw = fs::read_to_string(persisted_window_state_path(app).ok()?).ok()?;
    let state: WindowState = serde_json::from_str(&raw).ok()?;
    if state.width == 0 || state.height == 0 {
        return None;
    }
    let monitors = app.available_monitors().ok()?;
    let left = i64::from(state.x);
    let top = i64::from(state.y);
    let right = left + i64::from(state.width);
    let bottom = top + i64::from(state.height);
    monitors.into_iter().any(|monitor| {
        let monitor_left = i64::from(monitor.position().x);
        let monitor_top = i64::from(monitor.position().y);
        let monitor_right = monitor_left + i64::from(monitor.size().width);
        let monitor_bottom = monitor_top + i64::from(monitor.size().height);
        (right.min(monitor_right) - left.max(monitor_left)) >= WINDOW_VISIBILITY_MARGIN_PX
            && (bottom.min(monitor_bottom) - top.max(monitor_top)) >= WINDOW_VISIBILITY_MARGIN_PX
    }).then_some(state)
}

fn persist_app_icon_bytes(app: &AppHandle, bytes: Option<&[u8]>) -> Result<(), String> {
    let path = persisted_app_icon_path(app)?;
    if bytes.is_none() {
        return match fs::remove_file(path) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == ErrorKind::NotFound => Ok(()),
            Err(error) => Err(error.to_string()),
        };
    }
    let directory = path
        .parent()
        .ok_or_else(|| "无法确定应用图标保存位置".to_string())?;
    fs::create_dir_all(directory).map_err(|error| error.to_string())?;
    fs::write(path, bytes.unwrap()).map_err(|error| error.to_string())
}

#[cfg(target_os = "macos")]
fn set_macos_dock_icon(bytes: &[u8]) -> Result<(), String> {
    use objc2::{AnyThread, MainThreadMarker};
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::NSData;

    let mtm = MainThreadMarker::new().ok_or_else(|| "应用图标只能在主线程更新".to_string())?;
    let payload = if macos_version_major().unwrap_or(0) >= 26 {
        macos26_dock_bytes(bytes)
    } else {
        bytes.to_vec()
    };
    let data = NSData::with_bytes(&payload);
    let image = NSImage::initWithData(NSImage::alloc(), &data)
        .ok_or_else(|| "无法读取应用图标".to_string())?;
    let application = NSApplication::sharedApplication(mtm);
    unsafe {
        application.setApplicationIconImage(Some(&image));
    }
    Ok(())
}

/// macOS 26 系统遮罩（scripts/assets/macos26-dock-mask.png，1024）：取自
/// 系统渲染图标的 alpha 通道，与系统给 bundle 图标套用的形状一致。
/// Dock 显示的是 512 的运行时位图，遮罩与生成脚本同样在 512 上相乘。
#[cfg(target_os = "macos")]
fn macos26_mask_image() -> Option<&'static image::RgbaImage> {
    static MASK: std::sync::OnceLock<Option<image::RgbaImage>> = std::sync::OnceLock::new();
    MASK.get_or_init(|| {
        image::load_from_memory(include_bytes!("../../public/icons/macos26/mask.png"))
            .ok()
            .map(|image| image.to_rgba8())
    })
    .as_ref()
}

/// macOS 26 (Tahoe) 只对 bundle 内图标应用 Liquid Glass squircle 遮罩；
/// 经 setApplicationIconImage 设置的运行时 Dock 图标按原样显示，发送满版
/// 方图就会是方形"异形"图标。因此这里自行把图标整理成系统形状：
/// - 已经是圆角/遮罩形状（四角透明）的素材（macos26 预设、前端画布产物）
///   保持原样，只取中央正方形并缩放，形状与边距原样保留；
/// - 方形素材（3.2 遗留的持久化图标、画布兜底的自定义上传）先裁掉透明
///   边距，缩放后与系统遮罩 alpha 相乘，得到带标准边距的 squircle 图标。
/// 更早的系统不经过此函数，保留原始资产。只影响本次设置 Dock 的位图，
/// 持久化的仍是用户选择的原始数据。
#[cfg(target_os = "macos")]
fn macos26_dock_bytes(bytes: &[u8]) -> Vec<u8> {
    const TARGET_EDGE: u32 = 512;
    const ALPHA_THRESHOLD: u8 = 8;
    let Ok(image) = image::load_from_memory(bytes) else {
        return bytes.to_vec();
    };
    let rgba = image.to_rgba8();
    let (width, height) = rgba.dimensions();
    if width == 0 || height == 0 {
        return bytes.to_vec();
    }
    let alpha_at = |x: u32, y: u32| rgba.get_pixel(x, y).0[3];
    let corner_transparent = [
        alpha_at(2, 2),
        alpha_at(width.saturating_sub(3), 2),
        alpha_at(2, height.saturating_sub(3)),
        alpha_at(width.saturating_sub(3), height.saturating_sub(3)),
    ]
    .into_iter()
    .all(|alpha| alpha <= ALPHA_THRESHOLD);
    // 已带形状的素材直接取中央正方形；方形素材先裁掉透明边距（内容不满
    // 版时），让后续缩放铺满遮罩。
    let working = if corner_transparent {
        rgba
    } else {
        let mut left = u32::MAX;
        let mut top = u32::MAX;
        let mut right = 0;
        let mut bottom = 0;
        let mut has_content = false;
        for (x, y, pixel) in rgba.enumerate_pixels() {
            if pixel.0[3] > ALPHA_THRESHOLD {
                has_content = true;
                left = left.min(x);
                top = top.min(y);
                right = right.max(x);
                bottom = bottom.max(y);
            }
        }
        if !has_content {
            return bytes.to_vec();
        }
        image::imageops::crop_imm(&rgba, left, top, right - left + 1, bottom - top + 1).to_image()
    };
    let (working_width, working_height) = working.dimensions();
    if working_width == 0 || working_height == 0 {
        return bytes.to_vec();
    }
    let side = working_width.min(working_height);
    let square = image::imageops::crop_imm(
        &working,
        (working_width - side) / 2,
        (working_height - side) / 2,
        side,
        side,
    )
    .to_image();
    let mut resized = image::DynamicImage::ImageRgba8(square)
        .resize_exact(TARGET_EDGE, TARGET_EDGE, image::imageops::FilterType::Lanczos3)
        .to_rgba8();
    if !corner_transparent {
        if let Some(mask) = macos26_mask_image() {
            if mask.dimensions() == (TARGET_EDGE, TARGET_EDGE) {
                for (x, y, pixel) in resized.enumerate_pixels_mut() {
                    let mask_alpha = u32::from(mask.get_pixel(x, y).0[3]);
                    pixel.0[3] = ((u32::from(pixel.0[3]) * mask_alpha) / 255) as u8;
                }
            }
        }
    }
    let mut output = Vec::new();
    match image::DynamicImage::ImageRgba8(resized)
        .write_to(&mut std::io::Cursor::new(&mut output), image::ImageFormat::Png)
    {
        Ok(()) if !output.is_empty() => output,
        _ => bytes.to_vec(),
    }
}

/// 读取 macOS 主版本号（如 26），进程内缓存；读取失败返回 None，
/// 调用方按"旧系统"处理（不做 full-bleed 处理，行为与历史版本一致）。
#[cfg(target_os = "macos")]
fn macos_version_major() -> Option<u32> {
    static CACHE: std::sync::OnceLock<Option<u32>> = std::sync::OnceLock::new();
    *CACHE.get_or_init(|| {
        let output = std::process::Command::new("sw_vers")
            .arg("-productVersion")
            .output()
            .ok()?;
        let version = String::from_utf8_lossy(&output.stdout);
        version.trim().split('.').next()?.parse().ok()
    })
}

/// Windows 任务栏与 Alt-Tab 显示的是窗口的 ICON_BIG（任务栏图标），而
/// Tauri 的 `set_icon` 只设置 ICON_SMALL——即标题栏小图标，主窗口无边框
/// 本就没有标题栏。任务栏图标必须自行向窗口发送 WM_SETICON 才会更新，
/// 否则预设/自定义图标的切换在 Windows 上没有任何可见效果。
/// HICON 由本函数创建并在下一次替换时销毁（窗口不再引用旧值）。
#[cfg(target_os = "windows")]
fn set_windows_taskbar_icon(window: &WebviewWindow, bytes: &[u8]) -> Result<(), String> {
    use windows::Win32::Foundation::{LPARAM, WPARAM};
    use windows::Win32::UI::WindowsAndMessaging::{
        CreateIcon, DestroyIcon, GetSystemMetrics, SendMessageW, HICON, ICON_BIG, SM_CXICON,
        WM_SETICON,
    };

    static LAST_TASKBAR_ICON: std::sync::Mutex<Option<isize>> = std::sync::Mutex::new(None);

    let hwnd = window.hwnd().map_err(|error| error.to_string())?;
    let decoded = image::load_from_memory(bytes).map_err(|error| error.to_string())?;
    // 按系统当前的 DPI 尺寸生成，避免任务栏渲染时二次缩放发虚。
    let edge = unsafe { GetSystemMetrics(SM_CXICON) }.max(16) as u32;
    let resized = decoded
        .resize_exact(edge, edge, image::imageops::FilterType::Lanczos3)
        .to_rgba8();
    let (width, height) = resized.dimensions();
    let mut rgba = resized.into_raw();
    // CreateIcon 的 XOR 平面是 BGRA，AND 平面取反转的 alpha 作透明掩码。
    let mut and_mask = Vec::with_capacity(rgba.len() / 4);
    for pixel in rgba.chunks_exact_mut(4) {
        and_mask.push(u8::MAX - pixel[3]);
        pixel.swap(0, 2);
    }
    let icon = unsafe {
        CreateIcon(
            None,
            width as i32,
            height as i32,
            1,
            32,
            and_mask.as_ptr(),
            rgba.as_ptr(),
        )
    }
    .map_err(|error| error.to_string())?;
    unsafe {
        SendMessageW(
            hwnd,
            WM_SETICON,
            Some(WPARAM(ICON_BIG as usize)),
            Some(LPARAM(icon.0 as isize)),
        );
    }
    let previous = LAST_TASKBAR_ICON
        .lock()
        .ok()
        .and_then(|mut guarded| guarded.replace(icon.0 as isize));
    if let Some(previous) = previous {
        unsafe {
            let _ = DestroyIcon(HICON(previous as *mut core::ffi::c_void));
        }
    }
    Ok(())
}

/// 任务栏钉选图标用的 ICO 缓存文件，位于软件自身配置目录。
#[cfg(target_os = "windows")]
const PINNED_TASKBAR_ICO_FILE: &str = "app-icon-taskbar.ico";

/// 把 PNG 图标写成多尺寸 ICO（任务栏快捷方式只能引用 .ico 文件）：
/// 16–64 用未压缩 BMP 条目（BGRA 自下而上 + 反转 alpha 的 AND 掩码），
/// 256 用 ICO 规范允许的 PNG 条目，资源管理器原生支持。
#[cfg(target_os = "windows")]
fn write_windows_ico(png_bytes: &[u8], path: &Path) -> Result<(), String> {
    let source = image::load_from_memory(png_bytes).map_err(|error| error.to_string())?;
    let mut entries: Vec<(u8, Vec<u8>)> = Vec::new();
    for edge in [16u32, 24, 32, 48, 64] {
        entries.push((edge as u8, ico_bmp_entry(&source, edge)));
    }
    let mut png256 = Vec::new();
    source
        .resize_exact(256, 256, image::imageops::FilterType::Lanczos3)
        .write_to(&mut std::io::Cursor::new(&mut png256), image::ImageFormat::Png)
        .map_err(|error| error.to_string())?;
    entries.push((0, png256)); // 0 在目录项里表示 256

    let mut out = Vec::new();
    out.extend_from_slice(&0u16.to_le_bytes()); // 保留字段
    out.extend_from_slice(&1u16.to_le_bytes()); // 类型：图标
    out.extend_from_slice(&(entries.len() as u16).to_le_bytes());
    let mut offset = (6 + 16 * entries.len()) as u32;
    for (edge, data) in &entries {
        out.push(*edge); // 宽度（0 表示 256）
        out.push(*edge); // 高度
        out.push(0); // 调色板
        out.push(0); // 保留字段
        out.extend_from_slice(&1u16.to_le_bytes()); // 颜色平面
        out.extend_from_slice(&32u16.to_le_bytes()); // 位深
        out.extend_from_slice(&(data.len() as u32).to_le_bytes());
        out.extend_from_slice(&offset.to_le_bytes());
        offset += data.len() as u32;
    }
    for (_, data) in &entries {
        out.extend_from_slice(data);
    }
    if let Some(directory) = path.parent() {
        fs::create_dir_all(directory).map_err(|error| error.to_string())?;
    }
    fs::write(path, out).map_err(|error| error.to_string())
}

/// 单个尺寸的 ICO BMP 条目。
#[cfg(target_os = "windows")]
fn ico_bmp_entry(source: &image::DynamicImage, edge: u32) -> Vec<u8> {
    let resized = source
        .resize_exact(edge, edge, image::imageops::FilterType::Lanczos3)
        .to_rgba8();
    let (width, height) = resized.dimensions();
    let stride = width as usize * 4;
    let top_down = resized.into_raw();
    // ICO 的位图自下而上存放。
    let mut rows = vec![0u8; top_down.len()];
    for row in 0..height as usize {
        let target = height as usize - 1 - row;
        rows[target * stride..(target + 1) * stride]
            .copy_from_slice(&top_down[row * stride..(row + 1) * stride]);
    }
    for pixel in rows.chunks_exact_mut(4) {
        pixel.swap(0, 2); // RGBA → BGRA
    }
    // AND 掩码（1bpp，自下而上，行按 32 位对齐）：alpha < 128 记为透明。
    let mask_row = (width as usize).div_ceil(32) * 4;
    let mut mask = vec![0u8; mask_row * height as usize];
    for row in 0..height as usize {
        for column in 0..width as usize {
            let alpha = rows[row * stride + column * 4 + 3];
            if alpha < 128 {
                mask[row * mask_row + column / 8] |= 0x80u8 >> (column % 8);
            }
        }
    }
    let mut entry = Vec::with_capacity(40 + rows.len() + mask.len());
    entry.extend_from_slice(&40u32.to_le_bytes()); // biSize
    entry.extend_from_slice(&(width as i32).to_le_bytes());
    entry.extend_from_slice(&((height as i32) * 2).to_le_bytes()); // XOR + AND
    entry.extend_from_slice(&1u16.to_le_bytes()); // biPlanes
    entry.extend_from_slice(&32u16.to_le_bytes()); // biBitCount
    entry.extend_from_slice(&0u32.to_le_bytes()); // biCompression = BI_RGB
    entry.extend_from_slice(&((rows.len() + mask.len()) as u32).to_le_bytes());
    entry.extend_from_slice(&[0u8; 16]); // 其余字段为 0
    entry.extend_from_slice(&rows);
    entry.extend_from_slice(&mask);
    entry
}

/// 改写单个钉选快捷方式的图标位置；目标不是本程序 exe 时返回 false 跳过。
#[cfg(target_os = "windows")]
fn try_update_pinned_shortcut(shortcut: &Path, ico_wide: &[u16], exe_target: &str) -> bool {
    use std::iter::once;
    use std::os::windows::ffi::OsStrExt;
    use windows::core::{Interface, PCWSTR};
    use windows::Win32::System::Com::{
        CoCreateInstance, IPersistFile, CLSCTX_INPROC_SERVER, STGM_READ,
    };
    use windows::Win32::UI::Shell::{IShellLinkW, ShellLink, SLGP_RAWPATH};

    let shell_link: IShellLinkW = match unsafe {
        CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER)
    } {
        Ok(link) => link,
        Err(_) => return false,
    };
    let Ok(persist_file) = shell_link.cast::<IPersistFile>() else { return false };
    let shortcut_wide: Vec<u16> = shortcut
        .as_os_str()
        .encode_wide()
        .chain(once(0))
        .collect();
    unsafe {
        if persist_file
            .Load(PCWSTR::from_raw(shortcut_wide.as_ptr()), STGM_READ)
            .is_err()
        {
            return false;
        }
        let mut target = [0u16; 1024];
        if shell_link
            .GetPath(&mut target, std::ptr::null_mut(), SLGP_RAWPATH.0 as u32)
            .is_err()
        {
            return false;
        }
        let target_end = target.iter().position(|unit| *unit == 0).unwrap_or(0);
        let target = String::from_utf16_lossy(&target[..target_end]).to_lowercase();
        if target != exe_target {
            return false;
        }
        if shell_link
            .SetIconLocation(PCWSTR::from_raw(ico_wide.as_ptr()), 0)
            .is_err()
        {
            return false;
        }
        // 保存回原文件（PCWSTR::null() = Load 时的路径）。
        if persist_file.Save(PCWSTR::null(), true).is_err() {
            return false;
        }
    }
    true
}

/// 应用被固定到任务栏后，按钮显示的是钉选快捷方式（
/// %APPDATA%\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar
/// 下的 .lnk）的图标，WM_SETICON 对它无效——这正是"固定后无法应用图标
/// 预设"的原因。这里把每个指向本程序 exe 的钉选快捷方式的图标位置改写为
/// 刚写出的 ICO 缓存，并通知资源管理器刷新；恢复默认图标时写入的是打包
/// exe 的默认图标位图，行为一致。找不到钉选快捷方式（未固定）时静默跳过。
#[cfg(target_os = "windows")]
fn update_pinned_taskbar_shortcuts(ico_path: &Path) {
    use std::iter::once;
    use std::os::windows::ffi::OsStrExt;
    use windows::Win32::Foundation::RPC_E_CHANGED_MODE;
    use windows::Win32::System::Com::{CoInitializeEx, CoUninitialize, COINIT_MULTITHREADED};
    use windows::Win32::UI::Shell::{SHCNE_UPDATEITEM, SHCNF_PATHW, SHChangeNotify};

    let Ok(exe_path) = std::env::current_exe() else { return };
    let exe_target = exe_path.to_string_lossy().to_lowercase();
    let Some(app_data) = std::env::var_os("APPDATA") else { return };
    let pinned_dir = PathBuf::from(app_data)
        .join("Microsoft")
        .join("Internet Explorer")
        .join("Quick Launch")
        .join("User Pinned")
        .join("TaskBar");
    let Ok(entries) = fs::read_dir(&pinned_dir) else { return };
    let ico_wide: Vec<u16> = ico_path
        .as_os_str()
        .encode_wide()
        .chain(once(0))
        .collect();

    // set_app_icon 在异步线程（MTA），启动恢复在主线程（Tauri 事件循环多为
    // STA）：换模式失败说明 COM 已以其他模型初始化，直接继续使用即可；
    // 本次成功初始化的线程退出前配平 CoUninitialize。
    let coinit = unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) };
    let balanced = coinit != RPC_E_CHANGED_MODE;
    for entry in entries.flatten() {
        let shortcut = entry.path();
        if !shortcut
            .extension()
            .and_then(|extension| extension.to_str())
            .is_some_and(|extension| extension.eq_ignore_ascii_case("lnk"))
        {
            continue;
        }
        if try_update_pinned_shortcut(&shortcut, &ico_wide, &exe_target) {
            let shortcut_wide: Vec<u16> = shortcut
                .as_os_str()
                .encode_wide()
                .chain(once(0))
                .collect();
            unsafe {
                SHChangeNotify(
                    SHCNE_UPDATEITEM,
                    SHCNF_PATHW,
                    Some(shortcut_wide.as_ptr().cast()),
                    None,
                );
            }
        }
    }
    if balanced {
        unsafe { CoUninitialize() };
    }
}

#[tauri::command]
async fn set_app_icon(
    app: AppHandle,
    window: WebviewWindow,
    data_url: String,
    preset: Option<String>,
) -> Result<bool, String> {
    let preset_name = preset.unwrap_or_default();
    // 空 dataURL + 预设名 = 前端画布管线失败的兜底路径，直接使用内置预设图标；
    // 空 dataURL 且无预设名 = 恢复出厂默认图标。其余情况照常解码前端数据。
    let (bytes, resolved_data_url) = if data_url.is_empty() {
        match app_icon_preset_bytes(&preset_name) {
            Some(fallback) if !preset_name.is_empty() => (fallback.to_vec(), String::new()),
            _ => (include_bytes!("../icons/icon.png").to_vec(), String::new()),
        }
    } else {
        match decode_app_icon(&data_url) {
            Ok(bytes) => (bytes, data_url.clone()),
            Err(error) => match app_icon_preset_bytes(&preset_name) {
                Some(fallback) => (fallback.to_vec(), String::new()),
                None => return Err(error),
            },
        }
    };
    tauri::image::Image::from_bytes(&bytes).map_err(|error| error.to_string())?;
    #[cfg(target_os = "macos")]
    {
        let icon_bytes = bytes.clone();
        let (sender, receiver) = std::sync::mpsc::sync_channel(1);
        window
            .run_on_main_thread(move || {
                let _ = sender.send(set_macos_dock_icon(&icon_bytes));
            })
            .map_err(|error| error.to_string())?;
        tauri::async_runtime::spawn_blocking(move || {
            receiver
                .recv()
                .map_err(|_| "应用图标更新被中断".to_string())?
        })
        .await
        .map_err(|error| error.to_string())??;
    }
    #[cfg(target_os = "windows")]
    {
        let image = tauri::image::Image::from_bytes(&bytes).map_err(|error| error.to_string())?;
        window.set_icon(image).map_err(|error| error.to_string())?;
        set_windows_taskbar_icon(&window, &bytes)?;
        // 钉选到任务栏时按钮走快捷方式图标，与窗口图标分开同步；失败仅降级
        // 为旧行为（未钉选时无影响），不让整个应用图标命令报错。
        let ico_path = software_config_dir(&app).join(PINNED_TASKBAR_ICO_FILE);
        if write_windows_ico(&bytes, &ico_path).is_ok() {
            update_pinned_taskbar_shortcuts(&ico_path);
        }
    }
    #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
    {
        let image =
            tauri::image::Image::from_bytes(&bytes).map_err(|error| error.to_string())?;
        window.set_icon(image).map_err(|error| error.to_string())?;
    }
    if resolved_data_url.is_empty() {
        let is_known_preset = !preset_name.is_empty() && app_icon_preset_bytes(&preset_name).is_some();
        persist_app_icon_bytes(&app, if is_known_preset { Some(&bytes) } else { None })?;
    } else {
        persist_app_icon_bytes(&app, Some(&bytes))?;
    }
    Ok(true)
}

#[tauri::command]
fn save_theme_color(app: AppHandle, color: String) -> Result<(), String> {
    if parse_theme_color(&color).is_none() {
        return Err("主题颜色格式无效".to_string());
    }
    let path = persisted_theme_color_path(&app)?;
    let directory = path
        .parent()
        .ok_or_else(|| "无法确定主题颜色保存位置".to_string())?;
    fs::create_dir_all(directory).map_err(|error| error.to_string())?;
    fs::write(path, format!("{}\n", color.trim().to_lowercase()))
        .map_err(|error| error.to_string())
}

/// 解析"软件数据位置"（保存 Acta 自身设置的数据文件夹，与行记数据档案无关）：
/// 1) 已记录的自定义位置（app-data-dir.txt）；2) 便携版 exe 同级的 data 文件夹
/// ——没有记录时也会默认采用它（3.0.0 起：数据跟着程序走，不再落在系统 AppData；
/// 创建失败例如目录只读时回退 AppData 并交由前端 OOBE 引导选择）。
fn resolve_app_data_path(app: &AppHandle) -> Result<Option<PathBuf>, String> {
    let root = app.path().app_data_dir().map_err(|error| error.to_string())?;
    let _ = fs::create_dir_all(&root);
    if let Ok(recorded) = fs::read_to_string(root.join(APP_DATA_DIR_FILE)) {
        let recorded = recorded.trim();
        if !recorded.is_empty() {
            let dir = PathBuf::from(recorded);
            if dir.is_dir() {
                return Ok(Some(dir));
            }
        }
    }
    if let Some(portable) = portable_data_dir() {
        if prepare_portable_dir(&portable).is_ok() {
            // 便携默认直接采用，不往系统 AppData 写记录：便携语义下 AppData
            // 里不应有本软件的任何文件。此检测每次启动都会重新命中。
            return Ok(Some(portable));
        }
    }
    Ok(None)
}

/// 便携版数据目录：exe 所在目录下的 data 文件夹。
pub(crate) fn portable_data_dir() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let parent = exe.parent()?;
    // macOS 的 exe 在 Acta.app/Contents/MacOS 里，往 .app 内部写数据既会被签名
    // 校验干扰，也不符合"数据在程序旁"的便携语义；macOS 保持 AppData/OOBE 引导。
    if cfg!(target_os = "macos") && parent.file_name().and_then(|name| name.to_str()) == Some("MacOS") {
        return None;
    }
    Some(parent.join("data"))
}

fn prepare_portable_dir(dir: &Path) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|error| error.to_string())?;
    let marker = dir.join(APP_DATA_MARKER_FILE);
    if !marker.exists() {
        fs::write(marker, "Acta software data folder\n").map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn resolve_app_data_dir(app: AppHandle) -> Result<Value, String> {
    // OOBE 展示的"默认位置"：便携版优先给 exe 旁的 data 文件夹（可创建时），
    // 否则才是系统 AppData。
    let default_path = portable_data_dir()
        .filter(|dir| prepare_portable_dir(dir).is_ok())
        .map(|dir| dir.to_string_lossy().to_string())
        .or_else(|| app.path().app_data_dir().ok().map(|dir| dir.to_string_lossy().to_string()))
        .unwrap_or_default();
    Ok(match resolve_app_data_path(&app)? {
        Some(path) => json!({ "status": "ready", "path": path.to_string_lossy(), "defaultPath": default_path }),
        None => json!({ "status": "missing", "path": Value::Null, "defaultPath": default_path }),
    })
}

/// 校验并启用一个软件数据文件夹：创建目录、写入标识文件、记录位置到 app_data_dir，
/// 并返回该文件夹中已有的 settings.json（若存在，供前端迁移合并）。
#[tauri::command]
fn prepare_app_data_dir(app: AppHandle, path: String) -> Result<Value, String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("软件数据文件夹路径无效".into());
    }
    let dir = PathBuf::from(trimmed);
    fs::create_dir_all(&dir).map_err(|error| format!("无法创建软件数据文件夹：{error}"))?;
    fs::write(dir.join(APP_DATA_MARKER_FILE), "Acta software data folder\n")
        .map_err(|error| format!("文件夹不可写：{error}"))?;
    let root = app.path().app_data_dir().map_err(|error| error.to_string())?;
    fs::create_dir_all(&root).map_err(|error| error.to_string())?;
    fs::write(root.join(APP_DATA_DIR_FILE), format!("{}\n", dir.to_string_lossy()))
        .map_err(|error| error.to_string())?;
    let settings = fs::read_to_string(dir.join(APP_DATA_SETTINGS_FILE))
        .ok()
        .and_then(|raw| serde_json::from_str::<Value>(&raw).ok());
    Ok(json!({ "path": dir.to_string_lossy(), "settings": settings }))
}

#[tauri::command]
fn load_app_data_settings(app: AppHandle) -> Result<Option<Value>, String> {
    let Some(dir) = resolve_app_data_path(&app)? else { return Ok(None) };
    let raw = match fs::read(dir.join(APP_DATA_SETTINGS_FILE)) {
        Ok(raw) => raw,
        Err(_) => return Ok(None),
    };
    serde_json::from_slice::<Value>(&raw)
        .map(Some)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn save_app_data_settings(app: AppHandle, content: String) -> Result<(), String> {
    let Some(dir) = resolve_app_data_path(&app)? else {
        return Err("尚未设置软件数据文件夹".into());
    };
    let value: Value = serde_json::from_str(&content).map_err(|error| format!("设置内容无效：{error}"))?;
    let path = dir.join(APP_DATA_SETTINGS_FILE);
    let temp = dir.join(format!("{APP_DATA_SETTINGS_FILE}.tmp"));
    fs::write(&temp, serde_json::to_vec_pretty(&value).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())?;
    fs::rename(&temp, &path).map_err(|error| error.to_string())
}

#[tauri::command]
fn reveal_window(window: WebviewWindow) {
    let _ = window.show();
}

#[tauri::command]
fn clear_app_cache(window: WebviewWindow) -> Result<bool, String> {
    window
        .clear_all_browsing_data()
        .map_err(|error| error.to_string())?;
    Ok(true)
}

/// Remove any service worker before the webview loads so this build always runs its own
/// embedded assets.
///
/// The WebView2 user-data folder (`%LOCALAPPDATA%\<identifier>\EBWebView`) is shared
/// across versions and across launches, so a SW registered by an older version (e.g.
/// 1.1.000) persists and keeps serving stale cached assets - after an upgrade AND if the
/// user runs an old version again in between launches. Desktop embeds every asset, so a
/// SW is never wanted here; delete the whole `Service Worker` subtree (registrations +
/// caches + script cache) on EVERY launch. localStorage and IndexedDB (user notes) live
/// in sibling folders and are untouched. Must run before `tauri::Builder::run()` creates
/// the webview. Removing a missing dir is a harmless no-op.
#[cfg(target_os = "windows")]
fn purge_legacy_service_worker() {
    // com.mws.acta matches tauri.conf.json since 3.0.0; the pre-3.0 identifier
    // (com.mogrowangstudio.acta) is cleaned as well so a SW registered by an old
    // build can never serve stale assets after the identifier rename.
    const APP_IDENTIFIER: &str = "com.mws.acta";
    const LEGACY_IDENTIFIERS: [&str; 1] = ["com.mogrowangstudio.acta"];
    let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") else {
        return;
    };
    for identifier in LEGACY_IDENTIFIERS.into_iter().chain(std::iter::once(APP_IDENTIFIER)) {
        let app_dir = PathBuf::from(&local_app_data).join(identifier);
        let _ = fs::remove_dir_all(app_dir.join("EBWebView").join("Default").join("Service Worker"));
        let _ = fs::remove_file(app_dir.join("sw-policy.dat")); // leftover from an earlier build
    }
}

#[cfg(not(target_os = "windows"))]
fn purge_legacy_service_worker() {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    purge_legacy_service_worker();
    // 更新向导模式：主应用写好任务单后以 --acta-update-wizard 拉起本进程的
    // 第二个实例，独立小窗口展示安装进度；与主应用的常规启动完全隔离。
    let cli_args: Vec<String> = std::env::args().collect();
    let wizard_manifest = cli_args
        .iter()
        .position(|argument| argument == updater::WIZARD_FLAG)
        .and_then(|position| cli_args.get(position + 1))
        .map(std::path::PathBuf::from);
    // generate_context! 每个二进制只能展开一次（macOS Info.plist 嵌入符号），
    // 主应用与更新向导共用这一次展开。
    let context = tauri::generate_context!();
    if let Some(manifest_path) = wizard_manifest {
        if manifest_path.is_file() {
            updater::build_wizard_app(context, manifest_path).run(|_app_handle, _event| {});
            return;
        }
        eprintln!("更新清单不存在：{}", manifest_path.display());
        return;
    }
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();
            // 主窗口在 tauri.conf.json 里是 create:false，这里手动按同一份配置
            // 创建：更新向导模式需要完全绕开主窗口，配置窗口自动创建做不到这点。
            let window_config = app
                .handle()
                .config()
                .app
                .windows
                .iter()
                .find(|window| window.label == "main")
                .cloned();
            // Windows 便携版把 WebView2 用户数据（localStorage、缓存）也固定到
            // exe 旁的 data\webview，做到 AppData 零残留；目录不可写时退回默认。
            // （mut 仅 Windows 分支使用。）
            #[allow(unused_mut)]
            let mut window_builder = tauri::WebviewWindowBuilder::from_config(
                app_handle,
                window_config.as_ref().ok_or("主窗口配置缺失")?,
            )?;
            #[cfg(target_os = "windows")]
            if let Some(portable) = portable_data_dir() {
                if fs::create_dir_all(&portable).is_ok() {
                    window_builder = window_builder.data_directory(portable.join("webview"));
                }
            }
            window_builder.build()?;
            updater::cleanup_stale_backup();
            // 旧版本把主题色/图标/窗口状态写在系统 AppData，先搬到当前配置目录。
            migrate_legacy_config_files(app_handle);
            let stored_icon = persisted_app_icon_path(app_handle)
                .ok()
                .and_then(|path| fs::read(path).ok());
            if let Some(bytes) = stored_icon {
                #[cfg(target_os = "macos")]
                {
                    let _ = set_macos_dock_icon(&bytes);
                }
                #[cfg(target_os = "windows")]
                {
                    if let Some(window) = app.get_webview_window("main") {
                        if let Ok(image) = tauri::image::Image::from_bytes(&bytes) {
                            let _ = window.set_icon(image);
                        }
                        // 任务栏图标与 macOS Dock 图标同属启动可见面，恢复
                        // 失败不阻塞启动，交由设置里的重新应用兜底。
                        let _ = set_windows_taskbar_icon(&window, &bytes);
                        // 钉选快捷方式的图标同样随启动恢复（切换预设后固定、
                        // 或旧版本遗留的钉选图标都借此对齐）。
                        let ico_path = software_config_dir(app_handle).join(PINNED_TASKBAR_ICO_FILE);
                        if write_windows_ico(&bytes, &ico_path).is_ok() {
                            update_pinned_taskbar_shortcuts(&ico_path);
                        }
                    }
                }
                #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
                {
                    if let Some(window) = app.get_webview_window("main") {
                        if let Ok(image) = tauri::image::Image::from_bytes(&bytes) {
                            let _ = window.set_icon(image);
                        }
                    }
                }
            }
            // The window is created hidden (visible: false) and stays hidden
            // until the webview confirms the themed splash has painted
            // (reveal_window), so the very first frame the user ever sees is
            // the themed splash - never the native window background. Paint
            // the native background with the saved theme color anyway so even
            // the failsafe reveal below cannot flash a foreign color.
            // macOS skips this: its window is transparent, so a pre-paint
            // reveal shows nothing at all instead of any background color.
            #[cfg(not(target_os = "macos"))]
            if let Some(window) = app.get_webview_window("main") {
                let theme_color = persisted_theme_color_path(app_handle)
                    .ok()
                    .and_then(|path| fs::read_to_string(path).ok())
                    .and_then(|raw| parse_theme_color(&raw))
                    .or_else(|| parse_theme_color(DEFAULT_SIDEBAR_COLOR));
                let _ = window.set_background_color(theme_color);
            }
            // Restore where the user last kept the window (position, size and
            // maximized state). Applying it while the window is still hidden
            // means the reveal happens at the remembered spot with no jumping.
            if let Some(state) = load_window_state(app_handle) {
                if let Some(window) = app.get_webview_window("main") {
                    if state.maximized {
                        let _ = window.maximize();
                    } else {
                        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(state.x, state.y)));
                        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(state.width, state.height)));
                    }
                }
            }
            // Failsafe: if the front end never comes up, reveal the window
            // after a grace period instead of leaving the user with nothing.
            let failsafe_handle = app_handle.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(3000));
                if let Some(window) = failsafe_handle.get_webview_window("main") {
                    if !window.is_visible().unwrap_or(true) {
                        let _ = window.show();
                    }
                }
            });
            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::Moved(_) | tauri::WindowEvent::Resized(_) => {
                if let Some(webview) = window.app_handle().get_webview_window(window.label()) {
                    if let Some(state) = snapshot_window_state(&webview) {
                        if let Ok(mut cache) = WINDOW_STATE_CACHE.lock() {
                            *cache = Some(state);
                        }
                    }
                }
            }
            // The close button is the most deliberate exit path: flush the
            // current geometry to disk right away.
            tauri::WindowEvent::CloseRequested { .. } => flush_window_state(window.app_handle()),
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            upload_library,
            download_library,
            inspect_folder,
            web_dav_request,
            import_note,
            export_note,
            export_assets,
            clear_app_cache,
            data_folder_stats,
            set_app_icon,
            save_theme_color,
            reveal_window,
            resolve_app_data_dir,
            prepare_app_data_dir,
            load_app_data_settings,
            save_app_data_settings,
            check_app_update,
            download_app_update,
            prepare_update_restart
        ])
        .build(context)
        .expect("error while building Acta");
    // Any other exit path (Cmd+Q, taskbar quit, ...) also lands the latest
    // geometry on disk; the in-memory cache covers windows already destroyed.
    app.run(|app_handle, event| {
        if matches!(event, tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit) {
            flush_window_state(app_handle);
        }
    });
}
