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

fn persisted_app_icon_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|directory| directory.join(APP_ICON_FILE))
        .map_err(|error| error.to_string())
}

fn persist_app_icon(app: &AppHandle, data_url: &str, bytes: &[u8]) -> Result<(), String> {
    let path = persisted_app_icon_path(app)?;
    if data_url.is_empty() {
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
    fs::write(path, bytes).map_err(|error| error.to_string())
}

#[cfg(target_os = "macos")]
fn set_macos_dock_icon(bytes: &[u8]) -> Result<(), String> {
    use objc2::{ClassType, MainThreadMarker};
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::NSData;

    let mtm = MainThreadMarker::new().ok_or_else(|| "应用图标只能在主线程更新".to_string())?;
    let data = NSData::with_bytes(bytes);
    let image = NSImage::initWithData(NSImage::alloc(), &data)
        .ok_or_else(|| "无法读取应用图标".to_string())?;
    let application = NSApplication::sharedApplication(mtm);
    unsafe {
        application.setApplicationIconImage(Some(&image));
    }
    Ok(())
}

#[tauri::command]
async fn set_app_icon(
    app: AppHandle,
    window: WebviewWindow,
    data_url: String,
) -> Result<bool, String> {
    let bytes = decode_app_icon(&data_url)?;
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
    #[cfg(not(target_os = "macos"))]
    {
        let image =
            tauri::image::Image::from_bytes(&bytes).map_err(|error| error.to_string())?;
        window.set_icon(image).map_err(|error| error.to_string())?;
    }
    persist_app_icon(&app, &data_url, &bytes)?;
    Ok(true)
}

#[tauri::command]
fn clear_app_cache(window: WebviewWindow) -> Result<bool, String> {
    window
        .clear_all_browsing_data()
        .map_err(|error| error.to_string())?;
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();
            let stored_icon = persisted_app_icon_path(app_handle)
                .ok()
                .and_then(|path| fs::read(path).ok());
            if let (Some(bytes), Some(window)) =
                (stored_icon, app.get_webview_window("main"))
            {
                #[cfg(target_os = "macos")]
                {
                    let _ = set_macos_dock_icon(&bytes);
                }
                #[cfg(not(target_os = "macos"))]
                {
                    if let Ok(image) = tauri::image::Image::from_bytes(&bytes) {
                        let _ = window.set_icon(image);
                    }
                }
            }
            Ok(())
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
            set_app_icon
        ])
        .run(tauri::generate_context!())
        .expect("error while running Acta");
}
