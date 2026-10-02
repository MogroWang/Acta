// Acta 局域网同步：UDP 发现 + 极简 HTTP 传输（协议 v2），让同一局域网中的
// 两台 Acta 桌面客户端直接互传完整数据文件夹，不经过任何服务器。
//
// 安全模型：服务仅在用户开启「允许被其他设备发现」期间运行；发现与传输
// 都要求携带本次服务会话随机生成的 session 令牌。协议 v2 引入「信任此局域
// 网」（自动确认）：开启后其他设备可以不经确认直接读取本机任一行记数据
// 档案，推送也跳过确认直接写入（覆盖前仍由前端自动备份）；未开启时推送
// 走两段式确认——先收到写入计划（小体积）并等用户在界面确认，确认后才
// 传输真正的数据档案并等待写入完成。

use serde::Serialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::io::{ErrorKind, Read, Write};
use std::net::{TcpListener, TcpStream, UdpSocket};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager};

const LAN_PROTOCOL: u32 = 2;
const LAN_DISCOVERY_PORT: u16 = 44117;
const LAN_DISCOVERY_MAGIC: &str = "ACTA-LAN-V2 DISCOVER";
const LAN_HEADER_LIMIT: usize = 16 * 1024;
const LAN_BODY_LIMIT: usize = 256 * 1024 * 1024;
// 写入计划等待用户决定 150s：小于 HTTP 客户端的 180s 总超时，对方长时间
// 不响应时推送方会先收到明确的 408（未确认），而不是笼统的网络超时。
const LAN_DECIDE_WAIT: Duration = Duration::from_secs(150);
// 数据到位后等待前端备份并写入完成；大档案的备份与写入可能耗时较长。
const LAN_APPLY_WAIT: Duration = Duration::from_secs(240);
// 按需读取档案：前端加载并打包一个档案的最长等待时间。
const LAN_FETCH_WAIT: Duration = Duration::from_secs(60);
const LAN_BACKUP_KEEP: usize = 10;
const LAN_INCOMING_EVENT: &str = "lan-sync://incoming";
const LAN_DATA_EVENT: &str = "lan-sync://data";
const LAN_FETCH_EVENT: &str = "lan-sync://fetch";
const LAN_PROGRESS_EVENT: &str = "lan-sync://progress";
// 会话令牌不匹配（常见于对方的设备列表过期）时也通知界面，
// 让「对方收不到任何反馈」变成一条可理解的状态提示。
const LAN_REJECTED_EVENT: &str = "lan-sync://rejected";

#[derive(Clone, Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LanProfileMeta {
    id: String,
    name: String,
    notes: usize,
    todos: usize,
}

// 推送方在第一阶段发来的写入计划（不含数据本体）。
#[derive(Clone)]
struct PlanInfo {
    device: String,
    platform: String,
    profile: String,
    mode: String,
    target_profile_id: String,
    target_profile_name: String,
    notes: usize,
    todos: usize,
    classifications: usize,
}

impl PlanInfo {
    fn from_json(payload: &Value) -> Option<PlanInfo> {
        let mode = payload.get("mode").and_then(Value::as_str)?;
        if mode != "replace" && mode != "copy" {
            return None;
        }
        let target_profile_id = payload
            .get("targetProfileId")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();
        if mode == "replace" && target_profile_id.is_empty() {
            return None;
        }
        Some(PlanInfo {
            device: payload.get("device").and_then(Value::as_str).unwrap_or("Acta").to_string(),
            platform: payload.get("platform").and_then(Value::as_str).unwrap_or_default().to_string(),
            profile: payload.get("profile").and_then(Value::as_str).unwrap_or_default().to_string(),
            mode: mode.to_string(),
            target_profile_id,
            target_profile_name: payload
                .get("targetProfileName")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            notes: payload.get("notes").and_then(Value::as_u64).unwrap_or(0) as usize,
            todos: payload.get("todos").and_then(Value::as_u64).unwrap_or(0) as usize,
            classifications: payload.get("classifications").and_then(Value::as_u64).unwrap_or(0) as usize,
        })
    }

    fn event_json(&self, auto: bool) -> Value {
        json!({
            "auto": auto,
            "from": {"name": self.device, "platform": self.platform},
            "profile": self.profile,
            "mode": self.mode,
            "targetProfileId": self.target_profile_id,
            "targetProfileName": self.target_profile_name,
            "notes": self.notes,
            "todos": self.todos,
            "classifications": self.classifications
        })
    }
}

// 第一阶段：等待用户决定（信任网络时跳过等待直接接受）。
struct IncomingPlan {
    plan: PlanInfo,
    responder: mpsc::SyncSender<bool>,
}

// 第二阶段：数据已到位，等待前端备份并写入完成。applied 通道由确认/拒绝
// 命令发送、HTTP 连接线程接收：接收端在数据事件发出时被一次性取走，
// 发送端仍留在互斥锁内，保证两端都能访问。
struct PendingApply {
    token: String,
    plan: PlanInfo,
    bundle: Mutex<Option<Value>>,
    applied: mpsc::SyncSender<bool>,
    receiver: Mutex<Option<mpsc::Receiver<bool>>>,
}

struct LanService {
    session: String,
    http_port: u16,
    discovery_socket: bool,
    device: String,
    platform: String,
    app: AppHandle,
    stop: Arc<AtomicBool>,
    trusted: AtomicBool,
    profiles: Mutex<Vec<LanProfileMeta>>,
    incoming: Mutex<Option<IncomingPlan>>,
    pending_apply: Mutex<Option<PendingApply>>,
    // 按需读取档案的挂起请求：requestId → 应答通道。
    fetches: Mutex<HashMap<String, mpsc::SyncSender<Result<Value, String>>>>,
}

#[derive(Default)]
pub struct LanState {
    service: Mutex<Option<Arc<LanService>>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanServiceStatus {
    running: bool,
    discoverable: bool,
    port: u16,
    session: String,
    device: String,
    platform: String,
    trusted: bool,
    profiles: Vec<LanProfileMeta>,
}

// std 没有随机数设施；session 与发现 token 都是局域网内的握手混淆值而非
// 密钥，用时间、进程号与计数器做 xorshift 混合已足够防止外部进程猜中。
fn random_token() -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|elapsed| elapsed.as_nanos() as u64)
        .unwrap_or(0);
    let mixed = nanos
        ^ ((std::process::id() as u64) << 32)
        ^ COUNTER.fetch_add(1, Ordering::Relaxed).wrapping_mul(0x9E37_79B9_7F4A_7C15);
    let mut state = mixed;
    for _ in 0..4 {
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
    }
    format!("{state:016x}")
}

fn device_host_name() -> String {
    if let Ok(name) = std::env::var("COMPUTERNAME") {
        let trimmed = name.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }
    if let Ok(output) = std::process::Command::new("hostname").output() {
        let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !name.is_empty() {
            return name;
        }
    }
    "Acta".into()
}

fn bundle_shape_valid(bundle: &Value) -> bool {
    bundle.get("format").and_then(Value::as_str) == Some("acta-data-folder-bundle")
        && bundle.get("files").and_then(Value::as_object).is_some_and(|files| {
            files.contains_key(super::DATA_MANIFEST_FILE) && files.contains_key(super::CLASSIFICATIONS_FILE)
        })
}

fn bundle_info(bundle: &Value) -> (usize, usize, usize) {
    let files = bundle.get("files").cloned().unwrap_or(Value::Null);
    let manifest = files.get(super::DATA_MANIFEST_FILE).cloned().unwrap_or(Value::Null);
    let classifications = files
        .get(super::CLASSIFICATIONS_FILE)
        .cloned()
        .unwrap_or(Value::Null);
    (
        manifest.get("notes").and_then(Value::as_array).map(Vec::len).unwrap_or(0),
        manifest.get("todos").and_then(Value::as_array).map(Vec::len).unwrap_or(0),
        classifications
            .get("folders")
            .and_then(Value::as_array)
            .map(Vec::len)
            .unwrap_or(0),
    )
}

fn sanitized_profile_name(profile: &str) -> String {
    let sanitized: String = profile
        .chars()
        .map(|character| {
            if character.is_control() || "<>:\"/\\|?*".contains(character) {
                '_'
            } else {
                character
            }
        })
        .collect();
    let trimmed = sanitized.trim();
    if trimmed.is_empty() {
        "行记数据".into()
    } else {
        trimmed.chars().take(40).collect()
    }
}

fn meta_json(profiles: &[LanProfileMeta]) -> Value {
    Value::Array(profiles.iter().map(serde_json::to_value).collect::<Result<_, _>>().unwrap_or_default())
}

// 服务生命周期命令都是同步函数：协议 v2 之后启动不再携带数据档案，
// 内部只有短锁与线程启动，没有重活。
pub fn lan_sync_start_service(
    app: AppHandle,
    state: &tauri::State<'_, LanState>,
    profiles: Vec<LanProfileMeta>,
    trusted: bool,
) -> Result<LanServiceStatus, String> {
    let mut guard = state.service.lock().map_err(|error| error.to_string())?;
    if let Some(running) = guard.as_ref() {
        // 服务已在运行（幂等调用）：只刷新档案元数据与信任标记，保持端口
        // 与 session 稳定，对方设备上已显示的连接不会因此失效。
        *running.profiles.lock().map_err(|error| error.to_string())? = profiles;
        running.trusted.store(trusted, Ordering::Relaxed);
        return lan_sync_status_inner(state);
    }

    let listener = TcpListener::bind(("0.0.0.0", 0)).map_err(|error| format!("无法启动局域网同步服务：{error}"))?;
    let http_port = listener.local_addr().map_err(|error| error.to_string())?.port();
    let discovery_socket = UdpSocket::bind(("0.0.0.0", LAN_DISCOVERY_PORT)).ok();
    let discovery_socket = match discovery_socket {
        Some(socket) => Some(socket),
        // 端口被占用（常见于同一台机器上开着第二个 Acta）：服务仍然可用，
        // 只是不能被动被发现，也无法替同机其他实例回应搜索。
        None => None,
    };
    let service = Arc::new(LanService {
        session: format!("{}{}", random_token(), random_token()),
        http_port,
        discovery_socket: discovery_socket.is_some(),
        device: device_host_name(),
        platform: std::env::consts::OS.to_string(),
        app: app.clone(),
        stop: Arc::new(AtomicBool::new(false)),
        trusted: AtomicBool::new(trusted),
        profiles: Mutex::new(profiles),
        incoming: Mutex::new(None),
        pending_apply: Mutex::new(None),
        fetches: Mutex::new(HashMap::new()),
    });

    if let Some(socket) = discovery_socket {
        let service_for_udp = service.clone();
        std::thread::spawn(move || {
            let _ = socket.set_read_timeout(Some(Duration::from_millis(400)));
            let mut buffer = [0u8; 4096];
            while !service_for_udp.stop.load(Ordering::Relaxed) {
                match socket.recv_from(&mut buffer) {
                    Ok((size, source)) => {
                        let request = String::from_utf8_lossy(&buffer[..size]);
                        let Some(token) = request.trim().strip_prefix(LAN_DISCOVERY_MAGIC) else { continue };
                        let token = token.trim();
                        if token.is_empty() || token.len() > 64 || token.contains(char::is_whitespace) {
                            continue;
                        }
                        let (trusted, profiles) = {
                            let trusted = service_for_udp.trusted.load(Ordering::Relaxed);
                            let profiles = service_for_udp
                                .profiles
                                .lock()
                                .ok()
                                .map(|guard| meta_json(&guard))
                                .unwrap_or(Value::Array(Vec::new()));
                            (trusted, profiles)
                        };
                        let response = json!({
                            "app": "acta",
                            "protocol": LAN_PROTOCOL,
                            "token": token,
                            "session": service_for_udp.session,
                            "name": service_for_udp.device,
                            "platform": service_for_udp.platform,
                            "port": service_for_udp.http_port,
                            "trusted": trusted,
                            "profiles": profiles
                        });
                        let _ = socket.send_to(response.to_string().as_bytes(), source);
                    }
                    Err(error) if matches!(error.kind(), ErrorKind::WouldBlock | ErrorKind::TimedOut) => continue,
                    Err(_) => break,
                }
            }
        });
    }

    let listener = Arc::new(listener);
    let service_for_http = service.clone();
    std::thread::spawn(move || {
        let _ = listener.set_nonblocking(true);
        while !service_for_http.stop.load(Ordering::Relaxed) {
            match listener.accept() {
                Ok((stream, _)) => {
                    let service_for_connection = service_for_http.clone();
                    std::thread::spawn(move || handle_connection(stream, service_for_connection));
                }
                Err(error) if error.kind() == ErrorKind::WouldBlock => {
                    std::thread::sleep(Duration::from_millis(120));
                }
                Err(_) => break,
            }
        }
    });

    *guard = Some(service);
    drop(guard);
    lan_sync_status_inner(state)
}

fn shutdown_service(service: &Arc<LanService>) {
    service.stop.store(true, Ordering::Relaxed);
    if let Ok(mut incoming) = service.incoming.lock() {
        if let Some(plan) = incoming.take() {
            let _ = plan.responder.send(false);
        }
    }
    if let Ok(mut pending) = service.pending_apply.lock() {
        if let Some(pending) = pending.take() {
            let _ = pending.applied.send(false);
        }
    }
}

pub fn lan_sync_stop_service(state: &tauri::State<'_, LanState>) -> Result<(), String> {
    let mut guard = state.service.lock().map_err(|error| error.to_string())?;
    if let Some(service) = guard.take() {
        shutdown_service(&service);
    }
    Ok(())
}

pub fn lan_sync_service_status(state: &tauri::State<'_, LanState>) -> Result<LanServiceStatus, String> {
    lan_sync_status_inner(state)
}

fn lan_sync_status_inner(state: &tauri::State<'_, LanState>) -> Result<LanServiceStatus, String> {
    let guard = state.service.lock().map_err(|error| error.to_string())?;
    Ok(match guard.as_ref() {
        Some(service) => LanServiceStatus {
            running: true,
            discoverable: service.discovery_socket,
            port: service.http_port,
            session: service.session.clone(),
            device: service.device.clone(),
            platform: service.platform.clone(),
            trusted: service.trusted.load(Ordering::Relaxed),
            profiles: service.profiles.lock().map_err(|error| error.to_string())?.clone(),
        },
        None => LanServiceStatus {
            running: false,
            discoverable: false,
            port: 0,
            session: String::new(),
            device: device_host_name(),
            platform: std::env::consts::OS.to_string(),
            trusted: false,
            profiles: Vec::new(),
        },
    })
}

// 档案列表或信任标记变化时由前端调用；服务未运行时无操作。
pub fn lan_sync_update_meta(
    state: &tauri::State<'_, LanState>,
    profiles: Vec<LanProfileMeta>,
    trusted: bool,
) -> Result<(), String> {
    let guard = state.service.lock().map_err(|error| error.to_string())?;
    if let Some(service) = guard.as_ref() {
        *service.profiles.lock().map_err(|error| error.to_string())? = profiles;
        service.trusted.store(trusted, Ordering::Relaxed);
    }
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanPeer {
    ip: String,
    port: u16,
    session: String,
    name: String,
    platform: String,
    trusted: bool,
    profiles: Value,
}

pub async fn lan_sync_discover(
    state: &tauri::State<'_, LanState>,
    timeout_ms: u64,
) -> Result<Vec<LanPeer>, String> {
    let own_session = {
        let guard = state.service.lock().map_err(|error| error.to_string())?;
        guard.as_ref().map(|service| service.session.clone())
    };
    tauri::async_runtime::spawn_blocking(move || {
        let socket = UdpSocket::bind(("0.0.0.0", 0)).map_err(|error| format!("无法发起局域网搜索：{error}"))?;
        socket
            .set_broadcast(true)
            .map_err(|error| format!("无法发起局域网搜索：{error}"))?;
        let _ = socket.set_read_timeout(Some(Duration::from_millis(200)));
        let token = random_token();
        let message = format!("{LAN_DISCOVERY_MAGIC} {token}");
        // 有限广播覆盖默认网段，回环覆盖同一台机器上的多个实例。
        let _ = socket.send_to(message.as_bytes(), ("255.255.255.255", LAN_DISCOVERY_PORT));
        let _ = socket.send_to(message.as_bytes(), ("127.0.0.1", LAN_DISCOVERY_PORT));
        let deadline = Instant::now() + Duration::from_millis(timeout_ms.clamp(400, 5000));
        // 同一台设备可能从多个网段回应：按 ip+port 去重，先到先得。
        let mut peers: HashMap<(String, u16), LanPeer> = HashMap::new();
        let mut buffer = [0u8; 8192];
        while Instant::now() < deadline {
            match socket.recv_from(&mut buffer) {
                Ok((size, source)) => {
                    let Ok(payload) = serde_json::from_slice::<Value>(&buffer[..size]) else { continue };
                    if payload.get("app").and_then(Value::as_str) != Some("acta")
                        || payload.get("protocol").and_then(Value::as_u64) != Some(LAN_PROTOCOL as u64)
                        || payload.get("token").and_then(Value::as_str) != Some(token.as_str())
                    {
                        continue;
                    }
                    let session = payload
                        .get("session")
                        .and_then(Value::as_str)
                        .unwrap_or_default()
                        .to_string();
                    if session.is_empty() || own_session.as_deref() == Some(session.as_str()) {
                        continue;
                    }
                    let port = payload.get("port").and_then(Value::as_u64).unwrap_or(0) as u16;
                    if port == 0 {
                        continue;
                    }
                    let peer = LanPeer {
                        ip: source.ip().to_string(),
                        port,
                        session,
                        name: payload.get("name").and_then(Value::as_str).unwrap_or("Acta").to_string(),
                        platform: payload.get("platform").and_then(Value::as_str).unwrap_or_default().to_string(),
                        trusted: payload.get("trusted").and_then(Value::as_bool).unwrap_or(false),
                        profiles: payload.get("profiles").cloned().unwrap_or(Value::Array(Vec::new())),
                    };
                    peers.entry((peer.ip.clone(), peer.port)).or_insert(peer);
                }
                Err(error) if matches!(error.kind(), ErrorKind::WouldBlock | ErrorKind::TimedOut) => continue,
                Err(error) => return Err(error.to_string()),
            }
        }
        Ok(peers.into_values().collect())
    })
    .await
    .map_err(|error| error.to_string())?
}

fn lan_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(5))
        .timeout(Duration::from_secs(180))
        .build()
        .map_err(|error| error.to_string())
}

fn lan_peer_url(ip: &str, port: u16, path: &str, session: &str) -> String {
    format!("http://{ip}:{port}/acta-lan/v{LAN_PROTOCOL}/{path}?session={session}")
}

fn lan_http_error(status: u16) -> String {
    match status {
        403 => "对方拒绝了这次同步；若对方近期重启过 Acta 或重新开过「允许被发现」，请重新搜索设备后再试。".into(),
        404 => "对方设备上没有该数据。".into(),
        408 => "对方没有及时响应这次同步。".into(),
        409 => "对方已有一个同步请求待处理。".into(),
        413 => "数据超出局域网同步的大小限制（256 MB）。".into(),
        _ => format!("对方返回了错误状态（{status}）。"),
    }
}

pub async fn lan_sync_fetch_info(ip: String, port: u16, session: String) -> Result<Value, String> {
    let url = lan_peer_url(&ip, port, "info", &session);
    let response = lan_client()?
        .get(&url)
        .send()
        .await
        .map_err(|error| format!("无法连接该设备：{error}"))?;
    let status = response.status().as_u16();
    let body = response.text().await.map_err(|error| error.to_string())?;
    if status != 200 {
        return Err(lan_http_error(status));
    }
    let payload: Value = serde_json::from_str(&body).map_err(|error| error.to_string())?;
    if payload.get("app").and_then(Value::as_str) != Some("acta") {
        return Err("对方不是有效的 Acta 设备。".into());
    }
    Ok(payload)
}

// 第一阶段：发送写入计划（小体积），等待对方接受。
// 接受时返回对方生成的计划令牌，第二阶段传输数据时必须携带。
pub async fn lan_sync_push_plan(
    ip: String,
    port: u16,
    session: String,
    plan: Value,
) -> Result<String, String> {
    let url = lan_peer_url(&ip, port, "plan", &session);
    let response = lan_client()?
        .put(&url)
        .json(&plan)
        .send()
        .await
        .map_err(|error| format!("无法连接该设备：{error}"))?;
    let status = response.status().as_u16();
    let body = response.text().await.unwrap_or_default();
    match status {
        200 => {
            let parsed: Value = serde_json::from_str(&body).unwrap_or(Value::Null);
            match parsed.get("token").and_then(Value::as_str) {
                Some(token) if !token.is_empty() => Ok(token.to_string()),
                _ => Err("对方接受了请求但未返回有效凭据。".into()),
            }
        }
        _ => Err(lan_http_error(status)),
    }
}

// 第二阶段：携带计划令牌传输数据档案，等待对方备份并写入完成。
pub async fn lan_sync_push_data(
    ip: String,
    port: u16,
    session: String,
    token: String,
    bundle: Value,
) -> Result<bool, String> {
    if !bundle_shape_valid(&bundle) {
        return Err("这不是有效的 Acta 完整数据档案".into());
    }
    let url = format!("{}&plan={token}", lan_peer_url(&ip, port, "data", &session));
    let response = lan_client()?
        .put(&url)
        .timeout(LAN_APPLY_WAIT + Duration::from_secs(30))
        .json(&bundle)
        .send()
        .await
        .map_err(|error| format!("无法连接该设备：{error}"))?;
    let status = response.status().as_u16();
    let body = response.text().await.unwrap_or_default();
    match status {
        200 => {
            let parsed: Value = serde_json::from_str(&body).unwrap_or(Value::Null);
            if parsed.get("status").and_then(Value::as_str) == Some("applied") {
                Ok(true)
            } else {
                Err("对方写入数据失败。".into())
            }
        }
        _ => Err(lan_http_error(status)),
    }
}

// 读取对方的一份行记数据档案（要求对方开启「信任此局域网」）。
pub async fn lan_sync_fetch_profile_bundle(
    ip: String,
    port: u16,
    session: String,
    profile_id: String,
) -> Result<Value, String> {
    let url = format!(
        "{}&profile={}",
        lan_peer_url(&ip, port, "bundle", &session),
        urlencoding_lite(&profile_id)
    );
    let response = lan_client()?
        .get(&url)
        .timeout(LAN_FETCH_WAIT + Duration::from_secs(30))
        .send()
        .await
        .map_err(|error| format!("无法连接该设备：{error}"))?;
    let status = response.status().as_u16();
    let body = response.text().await.map_err(|error| error.to_string())?;
    if status != 200 {
        if status == 403 && body.contains("untrusted") {
            return Err("对方未开启「信任此局域网」，无法直接获取其行记数据。".into());
        }
        return Err(lan_http_error(status));
    }
    let bundle: Value = serde_json::from_str(&body).map_err(|error| format!("传输的数据无效：{error}"))?;
    if !bundle_shape_valid(&bundle) {
        return Err("对方返回的不是有效的 Acta 完整数据档案。".into());
    }
    Ok(bundle)
}

// 极简百分号编码：档案 id 由本应用生成（字母数字），仅需兜底少量字符。
fn urlencoding_lite(value: &str) -> String {
    let mut encoded = String::with_capacity(value.len());
    for byte in value.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.' | b'~') {
            encoded.push(byte as char);
        } else {
            encoded.push_str(&format!("%{byte:02X}"));
        }
    }
    encoded
}

fn handle_connection(mut stream: TcpStream, service: Arc<LanService>) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(15)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(60)));
    let Some((method, target, content_length)) = read_request_head(&mut stream) else {
        return;
    };
    let Some((path, query)) = target.split_once('?') else {
        let _ = write_http_response(&mut stream, 400, "Bad Request", r#"{"error":"bad request"}"#);
        return;
    };
    let expected_session = format!("session={}", service.session);
    if !query.split('&').any(|pair| pair == expected_session) {
        // 不携带具体数据内容，只提示来源地址；前端节流展示，避免刷屏。
        let _ = service.app.emit(
            LAN_REJECTED_EVENT,
            json!({"ip": stream.peer_addr().map(|addr| addr.ip().to_string()).unwrap_or_default()}),
        );
        let _ = write_http_response(&mut stream, 403, "Forbidden", r#"{"error":"forbidden"}"#);
        return;
    }

    match (method.as_str(), path) {
        ("GET", "/acta-lan/v2/info") => {
            let (trusted, profiles) = {
                let trusted = service.trusted.load(Ordering::Relaxed);
                let profiles = service
                    .profiles
                    .lock()
                    .ok()
                    .map(|guard| meta_json(&guard))
                    .unwrap_or(Value::Array(Vec::new()));
                (trusted, profiles)
            };
            let body = json!({
                "app": "acta",
                "protocol": LAN_PROTOCOL,
                "name": service.device,
                "platform": service.platform,
                "trusted": trusted,
                "profiles": profiles
            })
            .to_string();
            let _ = write_http_response(&mut stream, 200, "OK", &body);
        }
        ("GET", "/acta-lan/v2/bundle") => handle_profile_fetch(&mut stream, &service, query),
        ("PUT", "/acta-lan/v2/plan") => match content_length {
            Some(length) => handle_push_plan(&mut stream, &service, length),
            None => {
                let _ = write_http_response(&mut stream, 400, "Bad Request", r#"{"error":"missing length"}"#);
            }
        },
        ("PUT", "/acta-lan/v2/data") => match content_length {
            Some(length) => handle_push_data(&mut stream, &service, length, query),
            None => {
                let _ = write_http_response(&mut stream, 400, "Bad Request", r#"{"error":"missing length"}"#);
            }
        },
        ("GET", _) | ("PUT", _) => {
            let _ = write_http_response(&mut stream, 404, "Not Found", r#"{"error":"not found"}"#);
        }
        _ => {
            let _ = write_http_response(&mut stream, 405, "Method Not Allowed", r#"{"error":"method not allowed"}"#);
        }
    }
}

// 逐字节读取请求头直到空行；返回方法、目标路径与 Content-Length。
fn read_request_head(stream: &mut TcpStream) -> Option<(String, String, Option<usize>)> {
    let mut head = Vec::with_capacity(512);
    let mut byte = [0u8; 1];
    loop {
        match stream.read(&mut byte) {
            Ok(0) => return None,
            Ok(_) => {
                head.push(byte[0]);
                if head.ends_with(b"\r\n\r\n") {
                    break;
                }
                if head.len() > LAN_HEADER_LIMIT {
                    return None;
                }
            }
            Err(_) => return None,
        }
    }
    let head = String::from_utf8_lossy(&head);
    let mut lines = head.lines();
    let request_line = lines.next()?.trim().to_string();
    let mut parts = request_line.split_whitespace();
    let method = parts.next()?.to_ascii_uppercase();
    let target = parts.next()?.to_string();
    let content_length = lines
        .filter_map(|line| line.split_once(':'))
        .find(|(name, _)| name.trim().eq_ignore_ascii_case("content-length"))
        .and_then(|(_, value)| value.trim().parse::<usize>().ok());
    Some((method, target, content_length))
}

// 请求头读完后剩余的流就是请求体；按 Content-Length 分块读取，
// 期间发送进度事件，让接收界面能显示已接收的数据量。
fn read_request_body(stream: &mut TcpStream, length: usize, app: &AppHandle, progress: bool) -> Option<Vec<u8>> {
    if length > LAN_BODY_LIMIT {
        return None;
    }
    let mut body: Vec<u8> = Vec::with_capacity(length.min(64 * 1024 * 1024));
    let mut chunk = [0u8; 64 * 1024];
    let mut last_emit = Instant::now();
    while body.len() < length {
        let read_size = chunk.len().min(length - body.len());
        match stream.read(&mut chunk[..read_size]) {
            Ok(0) => return None,
            Ok(size) => {
                body.extend_from_slice(&chunk[..size]);
                if progress && last_emit.elapsed() >= Duration::from_millis(150) {
                    last_emit = Instant::now();
                    let _ = app.emit(LAN_PROGRESS_EVENT, json!({"direction":"receive","received":body.len(),"total":length}));
                }
            }
            Err(_) => return None,
        }
    }
    if progress {
        let _ = app.emit(LAN_PROGRESS_EVENT, json!({"direction":"receive","received":body.len(),"total":length}));
    }
    Some(body)
}

// 对方请求读取本机的一份行记数据档案：要求已开启「信任此局域网」，
// 实际数据由前端按需加载并提供（始终是最新内容）。
fn handle_profile_fetch(stream: &mut TcpStream, service: &Arc<LanService>, query: &str) {
    if !service.trusted.load(Ordering::Relaxed) {
        let _ = write_http_response(stream, 403, "Forbidden", r#"{"error":"untrusted"}"#);
        return;
    }
    let profile_id = query
        .split('&')
        .find_map(|pair| pair.strip_prefix("profile="))
        .unwrap_or("")
        .to_string();
    if profile_id.is_empty() || profile_id.len() > 120 {
        let _ = write_http_response(stream, 400, "Bad Request", r#"{"error":"bad profile"}"#);
        return;
    }
    let (tx, rx) = mpsc::sync_channel::<Result<Value, String>>(1);
    let request_id = random_token();
    if let Ok(mut fetches) = service.fetches.lock() {
        fetches.insert(request_id.clone(), tx);
    }
    let _ = service
        .app
        .emit(LAN_FETCH_EVENT, json!({"requestId": request_id, "profileId": profile_id}));
    match rx.recv_timeout(LAN_FETCH_WAIT) {
        Ok(Ok(bundle)) => {
            let _ = write_http_response(stream, 200, "OK", &bundle.to_string());
        }
        Ok(Err(error)) => {
            let body = json!({"error": error}).to_string();
            let _ = write_http_response(stream, 404, "Not Found", &body);
        }
        Err(_) => {
            if let Ok(mut fetches) = service.fetches.lock() {
                fetches.remove(&request_id);
            }
            let _ = write_http_response(stream, 408, "Request Timeout", r#"{"error":"timeout"}"#);
        }
    }
}

// 第一阶段：接收写入计划。信任网络直接接受；否则等待用户在界面确认。
fn handle_push_plan(stream: &mut TcpStream, service: &Arc<LanService>, length: usize) {
    let Some(body) = read_request_body(stream, length, &service.app, false) else {
        let _ = write_http_response(stream, 413, "Payload Too Large", r#"{"error":"too large"}"#);
        return;
    };
    let Ok(payload) = serde_json::from_slice::<Value>(&body) else {
        let _ = write_http_response(stream, 400, "Bad Request", r#"{"error":"invalid payload"}"#);
        return;
    };
    let Some(plan) = PlanInfo::from_json(&payload) else {
        let _ = write_http_response(stream, 400, "Bad Request", r#"{"error":"invalid plan"}"#);
        return;
    };
    let trusted = service.trusted.load(Ordering::Relaxed);
    let (responder, receiver) = mpsc::sync_channel::<bool>(1);
    {
        let mut incoming = match service.incoming.lock() {
            Ok(guard) => guard,
            Err(_) => {
                let _ = write_http_response(stream, 500, "Internal Server Error", r#"{"error":"unavailable"}"#);
                return;
            }
        };
        if incoming.is_some() {
            let _ = write_http_response(stream, 409, "Conflict", r#"{"error":"pending"}"#);
            return;
        }
        *incoming = Some(IncomingPlan { plan: plan.clone(), responder });
    }
    let _ = service.app.emit(LAN_INCOMING_EVENT, plan.event_json(trusted));

    // 信任网络：不做任何等待，直接进入待写入状态并接受。
    if trusted {
        let token = move_plan_to_pending(service, plan);
        let response = json!({"status": "accepted", "token": token}).to_string();
        let _ = write_http_response(stream, 200, "OK", &response);
        return;
    }

    match receiver.recv_timeout(LAN_DECIDE_WAIT) {
        Ok(true) => {
            // 用户已确认（decide 命令已把计划移入 pending_apply 并生成令牌）。
            let token = service
                .pending_apply
                .lock()
                .ok()
                .and_then(|guard| guard.as_ref().map(|pending| pending.token.clone()))
                .unwrap_or_default();
            let response = json!({"status": "accepted", "token": token}).to_string();
            let _ = write_http_response(stream, 200, "OK", &response);
        }
        Ok(false) => {
            let _ = write_http_response(stream, 403, "Forbidden", r#"{"status":"refused"}"#);
        }
        Err(_) => {
            if let Ok(mut incoming) = service.incoming.lock() {
                *incoming = None;
            }
            let _ = write_http_response(stream, 408, "Request Timeout", r#"{"status":"timeout"}"#);
        }
    }
}

// 把已接受的计划转入待写入状态；返回计划令牌。旧的待写入计划（若有）
// 会被新的替代，避免发送方中断后残留阻塞后续传输。
fn move_plan_to_pending(service: &Arc<LanService>, plan: PlanInfo) -> String {
    let (applied, receiver) = mpsc::sync_channel::<bool>(1);
    let token = random_token();
    let pending = PendingApply {
        token: token.clone(),
        plan,
        bundle: Mutex::new(None),
        applied,
        receiver: Mutex::new(Some(receiver)),
    };
    // 丢弃旧的待写入计划（其等待线程可能已超时退出，属正常情况）。
    let _ = service.pending_apply.lock().map(|mut guard| {
        if let Some(previous) = guard.replace(pending) {
            let _ = previous.applied.send(false);
        }
    });
    token
}

// 第二阶段：接收数据档案本体，等待前端备份并写入完成后应答。
fn handle_push_data(stream: &mut TcpStream, service: &Arc<LanService>, length: usize, query: &str) {
    let expected_token = query
        .split('&')
        .find_map(|pair| pair.strip_prefix("plan="))
        .unwrap_or("")
        .to_string();
    // 只读取令牌做校验，计划本体留在互斥锁内：确认/拒绝命令要向它发信号。
    let token_matches = service
        .pending_apply
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().map(|pending| pending.token == expected_token))
        .unwrap_or(false);
    if expected_token.is_empty() || !token_matches {
        let _ = write_http_response(stream, 409, "Conflict", r#"{"error":"no matching plan"}"#);
        return;
    }
    let Some(body) = read_request_body(stream, length, &service.app, true) else {
        let _ = write_http_response(stream, 413, "Payload Too Large", r#"{"error":"too large"}"#);
        return;
    };
    let Ok(bundle) = serde_json::from_slice::<Value>(&body) else {
        let _ = write_http_response(stream, 400, "Bad Request", r#"{"error":"invalid payload"}"#);
        return;
    };
    if !bundle_shape_valid(&bundle) {
        let _ = write_http_response(stream, 400, "Bad Request", r#"{"error":"invalid bundle"}"#);
        return;
    }
    // 计划元数据先取出来用于事件；数据放入待写入槽位。
    let (plan, receiver) = {
        let guard = match service.pending_apply.lock() {
            Ok(guard) => guard,
            Err(_) => {
                let _ = write_http_response(stream, 500, "Internal Server Error", r#"{"error":"unavailable"}"#);
                return;
            }
        };
        let Some(pending) = guard.as_ref() else {
            let _ = write_http_response(stream, 409, "Conflict", r#"{"error":"no matching plan"}"#);
            return;
        };
        if pending.token != expected_token {
            let _ = write_http_response(stream, 409, "Conflict", r#"{"error":"no matching plan"}"#);
            return;
        }
        if pending.bundle.lock().map(|mut slot| slot.replace(bundle.clone())).is_err() {
            let _ = write_http_response(stream, 500, "Internal Server Error", r#"{"error":"unavailable"}"#);
            return;
        }
        // 取走接收端：数据事件发出后，只有本次连接等待写入结果。
        (pending.plan.clone(), pending.receiver.lock().ok().and_then(|mut slot| slot.take()))
    };
    let Some(receiver) = receiver else {
        let _ = write_http_response(stream, 409, "Conflict", r#"{"error":"already waiting"}"#);
        return;
    };
    let _ = service.app.emit(
        LAN_DATA_EVENT,
        json!({
            "from": {"name": plan.device, "platform": plan.platform},
            "profile": plan.profile,
            "mode": plan.mode,
            "targetProfileId": plan.target_profile_id,
            "targetProfileName": plan.target_profile_name,
            "notes": plan.notes,
            "todos": plan.todos,
            "classifications": plan.classifications
        }),
    );
    match receiver.recv_timeout(LAN_APPLY_WAIT) {
        Ok(true) => {
            let _ = write_http_response(stream, 200, "OK", r#"{"status":"applied"}"#);
        }
        Ok(false) => {
            let _ = write_http_response(stream, 200, "OK", r#"{"status":"failed"}"#);
        }
        Err(_) => {
            // 写入超时：清掉这个已过期的计划，避免阻塞后续传输。
            let _ = service.pending_apply.lock().map(|mut guard| {
                if guard.as_ref().is_some_and(|pending| pending.token == expected_token) {
                    *guard = None;
                }
            });
            let _ = write_http_response(stream, 408, "Request Timeout", r#"{"status":"timeout"}"#);
        }
    }
}

fn write_http_response(stream: &mut TcpStream, status: u16, reason: &str, body: &str) -> std::io::Result<()> {
    let response = format!(
        "HTTP/1.1 {status} {reason}\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    stream.write_all(response.as_bytes())
}

/// 取出待确认的写入计划：用户在通知/详情确认对话框中的决定。
/// accept = true 时把计划转入待写入状态（生成令牌，等第二阶段数据）。
pub fn lan_sync_decide_incoming(state: &tauri::State<'_, LanState>, accept: bool) -> Result<(), String> {
    let service = {
        let guard = state.service.lock().map_err(|error| error.to_string())?;
        guard.as_ref().cloned().ok_or_else(|| "局域网同步服务未运行".to_string())?
    };
    let plan = service
        .incoming
        .lock()
        .map_err(|error| error.to_string())?
        .take()
        .ok_or_else(|| "当前没有待确认的同步请求".to_string())?;
    if accept {
        move_plan_to_pending(&service, plan.plan);
    }
    let _ = plan.responder.send(accept);
    Ok(())
}

/// 前端按需提供一份行记数据档案的完整数据包（对应 lan-sync://fetch 事件）。
pub fn lan_sync_provide_bundle(
    state: &tauri::State<'_, LanState>,
    request_id: String,
    ok: bool,
    bundle: Option<Value>,
    error: Option<String>,
) -> Result<(), String> {
    let service = {
        let guard = state.service.lock().map_err(|error| error.to_string())?;
        guard.as_ref().cloned().ok_or_else(|| "局域网同步服务未运行".to_string())?
    };
    let responder = service
        .fetches
        .lock()
        .map_err(|error| error.to_string())?
        .remove(&request_id)
        .ok_or_else(|| "没有对应的读取请求".to_string())?;
    let result = if ok {
        bundle.ok_or_else(|| "缺少数据内容".to_string()).map(Ok)
    } else {
        Ok(Err(error.unwrap_or_else(|| "档案不可用".into())))
    };
    let _ = responder.send(result?);
    Ok(())
}

/// 取出待写入的数据档案，交由前端备份并写入。
pub fn lan_sync_accept_incoming(state: &tauri::State<'_, LanState>) -> Result<Value, String> {
    let service = {
        let guard = state.service.lock().map_err(|error| error.to_string())?;
        guard.as_ref().cloned().ok_or_else(|| "局域网同步服务未运行".to_string())?
    };
    let bundle = {
        let guard = service.pending_apply.lock().map_err(|error| error.to_string())?;
        let pending = guard.as_ref().ok_or_else(|| "当前没有待写入的同步数据".to_string())?;
        let bundle = pending
            .bundle
            .lock()
            .map_err(|error| error.to_string())?
            .take()
            .ok_or_else(|| "数据尚未到位".to_string())?;
        bundle
    };
    Ok(bundle)
}

/// 备份与写入全部完成后调用：通知推送方同步成功。
pub fn lan_sync_confirm_incoming(state: &tauri::State<'_, LanState>) -> Result<(), String> {
    let service = {
        let guard = state.service.lock().map_err(|error| error.to_string())?;
        guard.as_ref().cloned().ok_or_else(|| "局域网同步服务未运行".to_string())?
    };
    let pending = service.pending_apply.lock().map_err(|error| error.to_string())?.take();
    if let Some(pending) = pending {
        let _ = pending.applied.send(true);
    }
    Ok(())
}

/// 用户拒绝，或接收过程中任何一步失败：通知推送方本次同步未完成。
pub fn lan_sync_reject_incoming(state: &tauri::State<'_, LanState>) -> Result<(), String> {
    let service = {
        let guard = state.service.lock().map_err(|error| error.to_string())?;
        guard.as_ref().cloned().ok_or_else(|| "局域网同步服务未运行".to_string())?
    };
    let pending = service.pending_apply.lock().map_err(|error| error.to_string())?.take();
    if let Some(pending) = pending {
        let _ = pending.applied.send(false);
        return Ok(());
    }
    let incoming = service.incoming.lock().map_err(|error| error.to_string())?.take();
    if let Some(plan) = incoming {
        let _ = plan.responder.send(false);
    }
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanBackupResult {
    path: String,
    notes: usize,
    todos: usize,
    bytes: u64,
    created_at: String,
}

fn directory_size(directory: &Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = fs::read_dir(directory) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_dir() {
                    total += directory_size(&entry.path());
                } else {
                    total += metadata.len();
                }
            }
        }
    }
    total
}

// 只保留最近 LAN_BACKUP_KEEP 份备份，避免备份文件夹无限增长。
fn prune_old_backups(backups: &Path) -> Result<(), String> {
    let mut entries: Vec<(SystemTime, PathBuf)> = fs::read_dir(backups)
        .map_err(|error| error.to_string())?
        .flatten()
        .filter(|entry| entry.file_name().to_string_lossy().starts_with("lan-"))
        .filter_map(|entry| {
            let modified = entry.metadata().ok()?.modified().ok()?;
            Some((modified, entry.path()))
        })
        .collect();
    if entries.len() <= LAN_BACKUP_KEEP {
        return Ok(());
    }
    entries.sort_by_key(|(modified, _)| *modified);
    let remove_count = entries.len() - LAN_BACKUP_KEEP;
    for (_, path) in entries.into_iter().take(remove_count) {
        let _ = fs::remove_dir_all(path);
    }
    Ok(())
}

// 把当前数据备份成一份标准数据档案文件夹（与"读取现有档案"兼容），
// 目录位于软件数据文件夹 backups/lan-sync/ 下。
pub async fn lan_sync_backup_local(
    app: AppHandle,
    bundle: Value,
    profile_name: String,
) -> Result<LanBackupResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if !bundle_shape_valid(&bundle) {
            return Err("这不是有效的 Acta 完整数据档案".into());
        }
        let base = match super::resolve_app_data_path(&app)? {
            Some(path) => path,
            None => app.path().app_data_dir().map_err(|error| error.to_string())?,
        };
        let backups = base.join("backups").join("lan-sync");
        fs::create_dir_all(&backups).map_err(|error| format!("无法创建备份文件夹：{error}"))?;
        let stamp = chrono::Local::now().format("%Y%m%d-%H%M%S");
        let profile = sanitized_profile_name(&profile_name);
        let mut directory = backups.join(format!("lan-{stamp}-{profile}"));
        let mut suffix = 2;
        while directory.exists() {
            directory = backups.join(format!("lan-{stamp}-{suffix}-{profile}"));
            suffix += 1;
        }
        super::write_portable_data_folder(&directory, &bundle)?;
        let _ = prune_old_backups(&backups);
        let (notes, todos, _) = bundle_info(&bundle);
        Ok(LanBackupResult {
            path: directory.to_string_lossy().into_owned(),
            notes,
            todos,
            bytes: directory_size(&directory),
            created_at: super::timestamp(),
        })
    })
    .await
    .map_err(|error| error.to_string())?
}
