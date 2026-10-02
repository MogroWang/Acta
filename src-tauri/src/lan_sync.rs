// Acta 局域网同步：UDP 发现 + 极简 HTTP 传输，让同一局域网中的两台 Acta
// 桌面客户端直接互传完整数据文件夹，不经过任何服务器。
//
// 安全模型：服务仅在用户开启"允许被其他设备发现"期间运行；发现与传输
// 都要求携带本次服务会话随机生成的 session 令牌；接收推送时必须由用户
// 在界面中确认，确认并落盘完成后推送方才会收到成功响应。

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

const LAN_PROTOCOL: u32 = 1;
const LAN_DISCOVERY_PORT: u16 = 44117;
const LAN_DISCOVERY_MAGIC: &str = "ACTA-LAN-V1 DISCOVER";
const LAN_HEADER_LIMIT: usize = 16 * 1024;
const LAN_BODY_LIMIT: usize = 256 * 1024 * 1024;
// 推送确认等待 150s：小于 HTTP 客户端的 180s 总超时，对方长时间不响应时
// 推送方会先收到明确的 408（未确认），而不是笼统的网络超时。
const LAN_PUSH_WAIT: Duration = Duration::from_secs(150);
const LAN_BACKUP_KEEP: usize = 10;
const LAN_INCOMING_EVENT: &str = "lan-sync://incoming";
const LAN_PROGRESS_EVENT: &str = "lan-sync://progress";
// 会话令牌不匹配（常见于对方的设备列表过期）时也通知界面，
// 让“对方收不到任何反馈”变成一条可理解的状态提示。
const LAN_REJECTED_EVENT: &str = "lan-sync://rejected";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanSnapshotInfo {
    profile: String,
    notes: usize,
    todos: usize,
    classifications: usize,
    bytes: u64,
    updated_at: String,
}

struct LanSnapshot {
    bundle: Value,
    info: LanSnapshotInfo,
}

struct IncomingPush {
    bundle: Value,
    responder: mpsc::SyncSender<bool>,
}

struct LanService {
    session: String,
    http_port: u16,
    discovery_socket: bool,
    device: String,
    platform: String,
    app: AppHandle,
    snapshot: Mutex<LanSnapshot>,
    stop: Arc<AtomicBool>,
    incoming: Mutex<Option<IncomingPush>>,
    // 用户已同意、正在备份与写入的请求：数据本体已在 accept 时移交给
    // 前端，这里只保留应答通道，全部成功后由 confirm 发送完成信号。
    pending: Mutex<Option<mpsc::SyncSender<bool>>>,
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
    #[serde(flatten)]
    snapshot: Option<LanSnapshotInfo>,
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

fn bundle_info(bundle: &Value, profile: &str, bytes: u64) -> LanSnapshotInfo {
    let files = bundle.get("files").cloned().unwrap_or(Value::Null);
    let manifest = files.get(super::DATA_MANIFEST_FILE).cloned().unwrap_or(Value::Null);
    let classifications = files
        .get(super::CLASSIFICATIONS_FILE)
        .cloned()
        .unwrap_or(Value::Null);
    LanSnapshotInfo {
        profile: profile.to_string(),
        notes: manifest.get("notes").and_then(Value::as_array).map(Vec::len).unwrap_or(0),
        todos: manifest.get("todos").and_then(Value::as_array).map(Vec::len).unwrap_or(0),
        classifications: classifications
            .get("folders")
            .and_then(Value::as_array)
            .map(Vec::len)
            .unwrap_or(0),
        bytes,
        updated_at: super::timestamp(),
    }
}

fn snapshot_info_json(info: &LanSnapshotInfo) -> Value {
    json!({
        "profile": info.profile,
        "notes": info.notes,
        "todos": info.todos,
        "classifications": info.classifications,
        "bytes": info.bytes,
        "updatedAt": info.updated_at
    })
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

// 服务生命周期命令对外是 async 函数：序列化完整数据档案的开销放在
// 阻塞线程池，避免大档案卡住主线程；搜索与传输命令同样是 async。
pub async fn lan_sync_start_service(
    app: AppHandle,
    state: &tauri::State<'_, LanState>,
    bundle: Value,
    profile_name: String,
) -> Result<LanServiceStatus, String> {
    if !bundle_shape_valid(&bundle) {
        return Err("这不是有效的 Acta 完整数据档案".into());
    }
    // 序列化只在计算档案体积时需要；移入阻塞线程池，避免大档案卡住主线程，
    // 闭包结束时把 bundle 原样交还，不做额外拷贝。
    let (bytes, bundle) = tauri::async_runtime::spawn_blocking(move || {
        serde_json::to_vec(&bundle).map(|data| (data.len(), bundle)).map_err(|error| error.to_string())
    })
    .await
    .map_err(|error| error.to_string())??;
    if bytes > LAN_BODY_LIMIT {
        return Err("数据文件夹超出局域网同步的大小限制（256 MB）".into());
    }
    let snapshot = LanSnapshot {
        info: bundle_info(&bundle, &profile_name, bytes as u64),
        bundle,
    };

    let mut guard = state.service.lock().map_err(|error| error.to_string())?;
    if let Some(running) = guard.as_ref() {
        // 服务已在运行（幂等调用）：只刷新快照，保持端口与 session 稳定，
        // 对方设备上已显示的连接不会因此失效。
        *running.snapshot.lock().map_err(|error| error.to_string())? = snapshot;
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
        snapshot: Mutex::new(snapshot),
        stop: Arc::new(AtomicBool::new(false)),
        incoming: Mutex::new(None),
        pending: Mutex::new(None),
    });

    if let Some(socket) = discovery_socket {
        let service_for_udp = service.clone();
        std::thread::spawn(move || {
            let _ = socket.set_read_timeout(Some(Duration::from_millis(400)));
            let mut buffer = [0u8; 1024];
            while !service_for_udp.stop.load(Ordering::Relaxed) {
                match socket.recv_from(&mut buffer) {
                    Ok((size, source)) => {
                        let request = String::from_utf8_lossy(&buffer[..size]);
                        let Some(token) = request.trim().strip_prefix(LAN_DISCOVERY_MAGIC) else { continue };
                        let token = token.trim();
                        if token.is_empty() || token.len() > 64 || token.contains(char::is_whitespace) {
                            continue;
                        }
                        let info = service_for_udp
                            .snapshot
                            .lock()
                            .ok()
                            .map(|guard| snapshot_info_json(&guard.info));
                        let response = json!({
                            "app": "acta",
                            "protocol": LAN_PROTOCOL,
                            "token": token,
                            "session": service_for_udp.session,
                            "name": service_for_udp.device,
                            "platform": service_for_udp.platform,
                            "port": service_for_udp.http_port,
                            "info": info
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
        if let Some(push) = incoming.take() {
            let _ = push.responder.send(false);
        }
    }
    if let Ok(mut pending) = service.pending.lock() {
        if let Some(responder) = pending.take() {
            let _ = responder.send(false);
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
        Some(service) => {
            let snapshot = service.snapshot.lock().map_err(|error| error.to_string())?;
            LanServiceStatus {
                running: true,
                discoverable: service.discovery_socket,
                port: service.http_port,
                session: service.session.clone(),
                device: service.device.clone(),
                platform: service.platform.clone(),
                snapshot: Some(snapshot.info.clone()),
            }
        }
        None => LanServiceStatus {
            running: false,
            discoverable: false,
            port: 0,
            session: String::new(),
            device: device_host_name(),
            platform: std::env::consts::OS.to_string(),
            snapshot: None,
        },
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanPeer {
    ip: String,
    port: u16,
    session: String,
    name: String,
    platform: String,
    profile: String,
    notes: usize,
    todos: usize,
    classifications: usize,
    bytes: u64,
    updated_at: String,
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
        let mut buffer = [0u8; 4096];
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
                    let info = payload.get("info").cloned().unwrap_or(Value::Null);
                    let peer = LanPeer {
                        ip: source.ip().to_string(),
                        port,
                        session,
                        name: payload.get("name").and_then(Value::as_str).unwrap_or("Acta").to_string(),
                        platform: payload.get("platform").and_then(Value::as_str).unwrap_or_default().to_string(),
                        profile: info.get("profile").and_then(Value::as_str).unwrap_or_default().to_string(),
                        notes: info.get("notes").and_then(Value::as_u64).unwrap_or(0) as usize,
                        todos: info.get("todos").and_then(Value::as_u64).unwrap_or(0) as usize,
                        classifications: info.get("classifications").and_then(Value::as_u64).unwrap_or(0) as usize,
                        bytes: info.get("bytes").and_then(Value::as_u64).unwrap_or(0),
                        updated_at: info.get("updatedAt").and_then(Value::as_str).unwrap_or_default().to_string(),
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
        403 => "对方拒绝了这次同步；若对方近期重启过 Acta 或重新开过“允许被发现”，请重新搜索设备后再试。".into(),
        404 => "对方设备上没有该数据。".into(),
        408 => "对方没有及时确认这次同步。".into(),
        409 => "对方已有一个同步请求待确认。".into(),
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

pub async fn lan_sync_fetch_bundle(app: AppHandle, ip: String, port: u16, session: String) -> Result<Value, String> {
    let url = lan_peer_url(&ip, port, "bundle", &session);
    let mut response = lan_client()?
        .get(&url)
        .send()
        .await
        .map_err(|error| format!("无法连接该设备：{error}"))?;
    let status = response.status().as_u16();
    if status != 200 {
        let _ = response.text().await;
        return Err(lan_http_error(status));
    }
    let total = response.content_length();
    // 分块接收并发送进度事件：大档案传输时界面能看到已接收的数据量，
    // 而不是长时间无响应地等待整个响应读完。
    let mut data: Vec<u8> = Vec::new();
    let mut last_emit = Instant::now();
    loop {
        match response.chunk().await {
            Ok(Some(chunk)) => {
                data.extend_from_slice(&chunk);
                if data.len() > LAN_BODY_LIMIT {
                    return Err("对方返回的数据超出局域网同步的大小限制（256 MB）".into());
                }
                if last_emit.elapsed() >= Duration::from_millis(150) {
                    last_emit = Instant::now();
                    let _ = app.emit(LAN_PROGRESS_EVENT, json!({"direction":"pull","received":data.len(),"total":total}));
                }
            }
            Ok(None) => break,
            Err(error) => return Err(format!("传输中断：{error}")),
        }
    }
    let _ = app.emit(LAN_PROGRESS_EVENT, json!({"direction":"pull","received":data.len(),"total":data.len()}));
    let bundle: Value = serde_json::from_slice(&data).map_err(|error| format!("传输的数据无效：{error}"))?;
    if !bundle_shape_valid(&bundle) {
        return Err("对方返回的不是有效的 Acta 完整数据档案。".into());
    }
    Ok(bundle)
}

async fn push_bundle_inner(
    ip: String,
    port: u16,
    session: String,
    bundle: Value,
    device_label: String,
    profile_name: String,
) -> Result<bool, String> {
    if !bundle_shape_valid(&bundle) {
        return Err("这不是有效的 Acta 完整数据档案".into());
    }
    let payload = json!({
        "device": device_label,
        "platform": std::env::consts::OS,
        "profile": profile_name,
        "bundle": bundle
    });
    let url = lan_peer_url(&ip, port, "bundle", &session);
    let response = lan_client()?
        .put(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|error| format!("无法连接该设备：{error}"))?;
    let status = response.status().as_u16();
    let body = response.text().await.unwrap_or_default();
    match status {
        200 => {
            let parsed: Value = serde_json::from_str(&body).unwrap_or(Value::Null);
            Ok(parsed.get("status").and_then(Value::as_str) == Some("accepted"))
        }
        _ => Err(lan_http_error(status)),
    }
}

pub async fn lan_sync_push_bundle(
    ip: String,
    port: u16,
    session: String,
    bundle: Value,
    device_label: String,
    profile_name: String,
) -> Result<bool, String> {
    push_bundle_inner(ip, port, session, bundle, device_label, profile_name).await
}

/// 直接复用本机服务当前持有的快照发送，避免完整档案在 IPC 上再传一遍：
/// 快照在每次保存时刷新，「发送到对方」拿到的仍是最新内容。
pub async fn lan_sync_push_snapshot(
    state: &tauri::State<'_, LanState>,
    ip: String,
    port: u16,
    session: String,
    device_label: String,
    profile_name: String,
) -> Result<bool, String> {
    let bundle = {
        let guard = state.service.lock().map_err(|error| error.to_string())?;
        let service = guard.as_ref().ok_or_else(|| "局域网同步服务未运行".to_string())?;
        let bundle = service.snapshot.lock().map_err(|error| error.to_string())?.bundle.clone();
        bundle
    };
    push_bundle_inner(ip, port, session, bundle, device_label, profile_name).await
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
        let _ = service.app.emit(LAN_REJECTED_EVENT, json!({"ip": stream.peer_addr().map(|addr| addr.ip().to_string()).unwrap_or_default()}));
        let _ = write_http_response(&mut stream, 403, "Forbidden", r#"{"error":"forbidden"}"#);
        return;
    }

    match (method.as_str(), path) {
        ("GET", "/acta-lan/v1/info") => {
            let info = service
                .snapshot
                .lock()
                .ok()
                .map(|guard| snapshot_info_json(&guard.info));
            let body = json!({
                "app": "acta",
                "protocol": LAN_PROTOCOL,
                "name": service.device,
                "platform": service.platform,
                "info": info
            })
            .to_string();
            let _ = write_http_response(&mut stream, 200, "OK", &body);
        }
        ("GET", "/acta-lan/v1/bundle") => {
            let snapshot = service.snapshot.lock().ok();
            match snapshot.as_ref().map(|guard| guard.bundle.to_string()) {
                Some(body) => {
                    let _ = write_http_response(&mut stream, 200, "OK", &body);
                }
                None => {
                    let _ = write_http_response(&mut stream, 500, "Internal Server Error", r#"{"error":"unavailable"}"#);
                }
            }
        }
        ("PUT", "/acta-lan/v1/bundle") => match content_length {
            Some(length) => handle_incoming_push(&mut stream, &service, length),
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
fn read_request_body(stream: &mut TcpStream, length: usize, app: &AppHandle) -> Option<Vec<u8>> {
    if length > LAN_BODY_LIMIT {
        return None;
    }
    let mut body: Vec<u8> = Vec::with_capacity(length);
    let mut chunk = [0u8; 64 * 1024];
    let mut last_emit = Instant::now();
    while body.len() < length {
        let read_size = chunk.len().min(length - body.len());
        match stream.read(&mut chunk[..read_size]) {
            Ok(0) => return None,
            Ok(size) => {
                body.extend_from_slice(&chunk[..size]);
                if last_emit.elapsed() >= Duration::from_millis(150) {
                    last_emit = Instant::now();
                    let _ = app.emit(LAN_PROGRESS_EVENT, json!({"direction":"receive","received":body.len(),"total":length}));
                }
            }
            Err(_) => return None,
        }
    }
    let _ = app.emit(LAN_PROGRESS_EVENT, json!({"direction":"receive","received":body.len(),"total":length}));
    Some(body)
}

fn handle_incoming_push(stream: &mut TcpStream, service: &Arc<LanService>, length: usize) {
    let Some(body) = read_request_body(stream, length, &service.app) else {
        let _ = write_http_response(stream, 413, "Payload Too Large", r#"{"error":"too large"}"#);
        return;
    };
    let Ok(payload) = serde_json::from_slice::<Value>(&body) else {
        let _ = write_http_response(stream, 400, "Bad Request", r#"{"error":"invalid payload"}"#);
        return;
    };
    let bundle = payload.get("bundle").cloned().unwrap_or(Value::Null);
    if !bundle_shape_valid(&bundle) {
        let _ = write_http_response(stream, 400, "Bad Request", r#"{"error":"invalid bundle"}"#);
        return;
    }

    let (responder, receiver) = mpsc::sync_channel::<bool>(1);
    // 档案统计要在 bundle 移入 incoming 之前算好，避免移动后再借用。
    let info = bundle_info(
        &bundle,
        payload.get("profile").and_then(Value::as_str).unwrap_or(""),
        body.len() as u64,
    );
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
        *incoming = Some(IncomingPush { bundle, responder });
    }

    // 事件里带上对方档案的完整统计（含归类数），供确认对话框展示。
    let event = json!({
        "from": {
            "name": payload.get("device").and_then(Value::as_str).unwrap_or("Acta"),
            "platform": payload.get("platform").and_then(Value::as_str).unwrap_or("")
        },
        "profile": info.profile,
        "notes": info.notes,
        "todos": info.todos,
        "classifications": info.classifications,
        "bytes": body.len()
    });
    let _ = service.app.emit(LAN_INCOMING_EVENT, event);
    match receiver.recv_timeout(LAN_PUSH_WAIT) {
        Ok(true) => {
            let _ = write_http_response(stream, 200, "OK", r#"{"status":"accepted"}"#);
        }
        Ok(false) => {
            let _ = write_http_response(stream, 403, "Forbidden", r#"{"status":"refused"}"#);
        }
        Err(_) => {
            if let Ok(mut incoming) = service.incoming.lock() {
                *incoming = None;
            }
            if let Ok(mut pending) = service.pending.lock() {
                *pending = None;
            }
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

/// 取出待确认的推送数据，交由前端展示详情并等待备份、写入全部完成。
/// 数据本体在此移交给前端（零拷贝移动），pending 只保留应答通道。
pub fn lan_sync_accept_incoming(state: &tauri::State<'_, LanState>) -> Result<Value, String> {
    let service = {
        let guard = state.service.lock().map_err(|error| error.to_string())?;
        guard.as_ref().cloned().ok_or_else(|| "局域网同步服务未运行".to_string())?
    };
    let push = service
        .incoming
        .lock()
        .map_err(|error| error.to_string())?
        .take()
        .ok_or_else(|| "当前没有待确认的同步请求".to_string())?;
    *service.pending.lock().map_err(|error| error.to_string())? = Some(push.responder);
    Ok(push.bundle)
}

/// 备份与写入全部完成后调用：通知推送方同步成功。
pub fn lan_sync_confirm_incoming(state: &tauri::State<'_, LanState>) -> Result<(), String> {
    let service = {
        let guard = state.service.lock().map_err(|error| error.to_string())?;
        guard.as_ref().cloned().ok_or_else(|| "局域网同步服务未运行".to_string())?
    };
    let responder = service.pending.lock().map_err(|error| error.to_string())?.take();
    if let Some(responder) = responder {
        let _ = responder.send(true);
    }
    Ok(())
}

/// 用户拒绝，或接收过程中任何一步失败：通知推送方本次同步未完成。
pub fn lan_sync_reject_incoming(state: &tauri::State<'_, LanState>) -> Result<(), String> {
    let service = {
        let guard = state.service.lock().map_err(|error| error.to_string())?;
        guard.as_ref().cloned().ok_or_else(|| "局域网同步服务未运行".to_string())?
    };
    let responder = service.pending.lock().map_err(|error| error.to_string())?.take();
    if let Some(responder) = responder {
        let _ = responder.send(false);
        return Ok(());
    }
    let incoming = service.incoming.lock().map_err(|error| error.to_string())?.take();
    if let Some(push) = incoming {
        let _ = push.responder.send(false);
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
        let info = bundle_info(&bundle, &profile_name, directory_size(&directory));
        Ok(LanBackupResult {
            path: directory.to_string_lossy().into_owned(),
            notes: info.notes,
            todos: info.todos,
            bytes: info.bytes,
            created_at: super::timestamp(),
        })
    })
    .await
    .map_err(|error| error.to_string())?
}
