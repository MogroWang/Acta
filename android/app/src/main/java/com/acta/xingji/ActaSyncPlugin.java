package com.acta.xingji;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import org.json.JSONObject;

@CapacitorPlugin(name = "ActaSync")
public class ActaSyncPlugin extends Plugin {
    private static final String SYNC_FILE = "acta-library.json";
    private static final int MAX_NOTE_BYTES = 5 * 1024 * 1024;

    @PluginMethod
    public void chooseSyncFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
            Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );
        startActivityForResult(call, intent, "folderPickerResult");
    }

    @ActivityCallback
    private void folderPickerResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.resolve();
            return;
        }

        Uri uri = data.getData();
        int flags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        try {
            getContext().getContentResolver().takePersistableUriPermission(uri, flags);
        } catch (SecurityException ignored) {
            // Some document providers grant session access without persistable permissions.
        }

        JSObject response = new JSObject();
        response.put("uri", uri.toString());
        DocumentFile directory = DocumentFile.fromTreeUri(getContext(), uri);
        response.put("name", directory != null && directory.getName() != null ? directory.getName() : "行记数据");
        call.resolve(response);
    }

    @PluginMethod
    public void uploadLibrary(PluginCall call) {
        String folder = call.getString("folder");
        JSObject library = call.getObject("library");
        if (folder == null || library == null) {
            call.reject("未选择同步文件夹或资料库为空");
            return;
        }

        try {
            DocumentFile directory = requireDirectory(folder);
            DocumentFile file = directory.findFile(SYNC_FILE);
            if (file == null) file = directory.createFile("application/json", SYNC_FILE);
            if (file == null) throw new IllegalStateException("无法创建同步文件");

            SimpleDateFormat timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            timestamp.setTimeZone(TimeZone.getTimeZone("UTC"));
            String syncedAt = timestamp.format(new Date());
            JSObject payload = new JSObject();
            payload.put("format", "acta-library");
            payload.put("version", 1);
            payload.put("syncedAt", syncedAt);
            payload.put("library", library);

            try (OutputStream output = getContext().getContentResolver().openOutputStream(file.getUri(), "wt")) {
                if (output == null) throw new IllegalStateException("无法写入同步文件");
                output.write(payload.toString(2).getBytes(StandardCharsets.UTF_8));
            }

            JSObject response = new JSObject();
            response.put("path", file.getUri().toString());
            response.put("syncedAt", syncedAt);
            call.resolve(response);
        } catch (Exception error) {
            call.reject(error.getMessage(), error);
        }
    }

    @PluginMethod
    public void downloadLibrary(PluginCall call) {
        String folder = call.getString("folder");
        if (folder == null) {
            call.reject("未选择同步文件夹");
            return;
        }

        try {
            DocumentFile directory = requireDirectory(folder);
            DocumentFile file = directory.findFile(SYNC_FILE);
            if (file == null) throw new IllegalStateException("所选文件夹中没有 acta-library.json");

            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (InputStream input = getContext().getContentResolver().openInputStream(file.getUri())) {
                if (input == null) throw new IllegalStateException("无法读取同步文件");
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) != -1) bytes.write(buffer, 0, count);
            }

            JSONObject payload = new JSONObject(bytes.toString(StandardCharsets.UTF_8.name()));
            if (!"acta-library".equals(payload.optString("format")) || !payload.has("library")) {
                throw new IllegalStateException("这不是有效的 Acta 数据文件");
            }

            JSObject response = new JSObject();
            response.put("library", JSObject.fromJSONObject(payload.getJSONObject("library")));
            response.put("syncedAt", payload.optString("syncedAt"));
            response.put("path", file.getUri().toString());
            call.resolve(response);
        } catch (Exception error) {
            call.reject(error.getMessage(), error);
        }
    }

    @PluginMethod
    public void importNote(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] {
            "text/markdown", "text/plain", "text/x-markdown", "application/octet-stream"
        });
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        startActivityForResult(call, intent, "noteImportResult");
    }

    @ActivityCallback
    private void noteImportResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.resolve();
            return;
        }

        try {
            Uri uri = data.getData();
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (InputStream input = getContext().getContentResolver().openInputStream(uri)) {
                if (input == null) throw new IllegalStateException("无法读取笔记文件");
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    if (bytes.size() + count > MAX_NOTE_BYTES) throw new IllegalStateException("文件不能超过 5 MB");
                    bytes.write(buffer, 0, count);
                }
            }
            DocumentFile picked = DocumentFile.fromSingleUri(getContext(), uri);
            JSObject response = new JSObject();
            response.put("content", bytes.toString(StandardCharsets.UTF_8.name()));
            response.put("fileName", picked != null && picked.getName() != null ? picked.getName() : "Imported note.md");
            response.put("path", uri.toString());
            call.resolve(response);
        } catch (Exception error) {
            call.reject(error.getMessage(), error);
        }
    }

    @PluginMethod
    public void exportNote(PluginCall call) {
        String fileName = call.getString("fileName", "Acta note.md");
        String content = call.getString("content");
        if (content == null) {
            call.reject("笔记内容为空");
            return;
        }
        if (content.getBytes(StandardCharsets.UTF_8).length > MAX_NOTE_BYTES) {
            call.reject("文件不能超过 5 MB");
            return;
        }
        String safeName = fileName.replaceAll("[\\\\/:*?\"<>|]", "-");
        if (!safeName.toLowerCase(Locale.US).endsWith(".md")) safeName += ".md";

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("text/markdown");
        intent.putExtra(Intent.EXTRA_TITLE, safeName);
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        startActivityForResult(call, intent, "noteExportResult");
    }

    @ActivityCallback
    private void noteExportResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.resolve();
            return;
        }

        try {
            Uri uri = data.getData();
            String content = call.getString("content", "");
            try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new IllegalStateException("无法写入笔记文件");
                output.write(content.getBytes(StandardCharsets.UTF_8));
            }
            DocumentFile exported = DocumentFile.fromSingleUri(getContext(), uri);
            JSObject response = new JSObject();
            response.put("fileName", exported != null && exported.getName() != null ? exported.getName() : call.getString("fileName"));
            response.put("path", uri.toString());
            call.resolve(response);
        } catch (Exception error) {
            call.reject(error.getMessage(), error);
        }
    }

    private DocumentFile requireDirectory(String folder) {
        DocumentFile directory = DocumentFile.fromTreeUri(getContext(), Uri.parse(folder));
        if (directory == null || !directory.exists() || !directory.isDirectory()) {
            throw new IllegalStateException("同步文件夹不可用，请重新选择");
        }
        return directory;
    }
}
