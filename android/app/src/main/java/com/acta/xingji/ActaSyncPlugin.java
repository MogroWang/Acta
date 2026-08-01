package com.mws.acta;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.provider.DocumentsContract;
import android.util.Base64;
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
import java.util.HashSet;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "ActaSync")
public class ActaSyncPlugin extends Plugin {
    private static final String SYNC_FILE = "acta-library.json";
    private static final String DATA_MANIFEST_FILE = "acta-manifest.json";
    private static final String CLASSIFICATIONS_FILE = "classifications.json";
    private static final String NOTES_DIRECTORY = "notes";
    private static final String TODOS_DIRECTORY = "todos";
    private static final int MAX_NOTE_BYTES = 5 * 1024 * 1024;
    private static final int MAX_EXPORT_ASSET_BYTES = 64 * 1024 * 1024;
    private static final int MAX_SYNC_FILE_BYTES = 32 * 1024 * 1024;
    private static final String FOLDER_PREFERENCES = "acta.folder.preferences";
    private static final String LAST_FOLDER_URI = "lastFolderUri";
    private static final String[] APP_ICON_ALIASES = {
        "LauncherDefault",
        "LauncherPositive",
        "LauncherOutline",
        "LauncherOriginal"
    };

    @PluginMethod
    public void clearAppCache(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getBridge().getWebView().clearCache(true);
            call.resolve();
        });
    }

    @PluginMethod
    public void setAppIcon(PluginCall call) {
        String preset = call.getString("preset", "default");
        String selectedAlias = appIconAlias(preset);
        if (selectedAlias == null) {
            call.reject("不支持的应用图标");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("应用窗口尚未准备好");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                PackageManager packageManager = getContext().getPackageManager();
                String packageName = getContext().getPackageName();
                ComponentName selectedComponent = new ComponentName(packageName, packageName + "." + selectedAlias);
                packageManager.setComponentEnabledSetting(
                    selectedComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                );
                for (String alias : APP_ICON_ALIASES) {
                    if (alias.equals(selectedAlias)) continue;
                    packageManager.setComponentEnabledSetting(
                        new ComponentName(packageName, packageName + "." + alias),
                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                        PackageManager.DONT_KILL_APP
                    );
                }
                JSObject response = new JSObject();
                response.put("preset", preset);
                call.resolve(response);
            } catch (Exception error) {
                call.reject("无法切换应用图标", error);
            }
        });
    }

    private String appIconAlias(String preset) {
        switch (preset) {
            case "default": return "LauncherDefault";
            case "positive": return "LauncherPositive";
            case "outline": return "LauncherOutline";
            case "original": return "LauncherOriginal";
            default: return null;
        }
    }

    @PluginMethod
    public void chooseSyncFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addCategory(Intent.CATEGORY_DEFAULT);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
            Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String previousFolder = getContext().getSharedPreferences(FOLDER_PREFERENCES, 0).getString(LAST_FOLDER_URI, "");
            if (!previousFolder.isEmpty()) intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, Uri.parse(previousFolder));
        }
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
        if ((flags & Intent.FLAG_GRANT_READ_URI_PERMISSION) == 0 || (flags & Intent.FLAG_GRANT_WRITE_URI_PERMISSION) == 0) {
            call.reject("所选文件夹没有完整的读写权限，请重新选择");
            return;
        }
        try {
            getContext().getContentResolver().takePersistableUriPermission(uri, flags);
        } catch (SecurityException error) {
            call.reject("无法保存所选文件夹的访问权限，请选择其他文件夹", error);
            return;
        }

        DocumentFile directory = DocumentFile.fromTreeUri(getContext(), uri);
        if (directory == null || !directory.exists() || !directory.isDirectory() || !directory.canRead() || !directory.canWrite()) {
            call.reject("所选位置不是可读写的文件夹，请重新选择");
            return;
        }
        getContext().getSharedPreferences(FOLDER_PREFERENCES, 0).edit().putString(LAST_FOLDER_URI, uri.toString()).apply();

        JSObject response = new JSObject();
        response.put("uri", uri.toString());
        response.put("name", directory != null && directory.getName() != null ? directory.getName() : "行记数据");
        call.resolve(response);
    }

    @PluginMethod
    public void setSystemBars(PluginCall call) {
        String colorValue = call.getString("color", "#E7E7E3");
        final int color;
        try {
            color = Color.parseColor(colorValue);
        } catch (IllegalArgumentException error) {
            call.reject("无效的系统栏颜色", error);
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("应用窗口尚未准备好");
            return;
        }
        activity.runOnUiThread(() -> {
            MainActivity.applySystemBars(activity, color);
            SharedPreferences preferences = activity.getSharedPreferences(MainActivity.SYSTEM_BAR_PREFERENCES, 0);
            preferences.edit()
                .putInt(MainActivity.SYSTEM_BAR_COLOR, color)
                .apply();
            call.resolve();
        });
    }

    @PluginMethod
    public void uploadLibrary(PluginCall call) {
        String folder = call.getString("folder");
        JSObject library = call.getObject("library");
        if (folder == null || library == null) {
            call.reject("No sync folder or library was provided");
            return;
        }

        try {
            if (!"acta-data-folder-bundle".equals(library.optString("format")) || library.optInt("version") != 3) {
                throw new IllegalStateException("This is not a valid Acta V3 data folder bundle");
            }
            JSONObject files = requireObject(library, "files");
            JSONObject manifest = requireObject(files, DATA_MANIFEST_FILE);
            JSONObject classifications = requireObject(files, CLASSIFICATIONS_FILE);
            if (
                !"acta-data-folder".equals(manifest.optString("format")) ||
                manifest.optInt("version") != 3 ||
                !CLASSIFICATIONS_FILE.equals(manifest.optString("classifications")) ||
                !"acta-classifications".equals(classifications.optString("format")) ||
                classifications.optInt("version") != 1 ||
                classifications.optJSONArray("folders") == null
            ) {
                throw new IllegalStateException("This is not a valid Acta V3 data folder structure");
            }

            DocumentFile directory = requireDirectory(folder);
            DocumentFile notesDirectory = getOrCreateDirectory(directory, NOTES_DIRECTORY);
            DocumentFile todosDirectory = getOrCreateDirectory(directory, TODOS_DIRECTORY);
            writeDocument(directory, CLASSIFICATIONS_FILE, "application/json", classifications.toString(2));
            Set<String> noteFiles = writeCollection(notesDirectory, files.optJSONObject(NOTES_DIRECTORY), true);
            Set<String> todoFiles = writeCollection(todosDirectory, files.optJSONObject(TODOS_DIRECTORY), false);
            writeDocument(directory, DATA_MANIFEST_FILE, "application/json", manifest.toString(2));
            cleanCollection(notesDirectory, noteFiles);
            cleanCollection(todosDirectory, todoFiles);

            DocumentFile legacy = directory.findFile(SYNC_FILE);
            if (legacy != null && legacy.isFile()) legacy.delete();

            JSObject response = new JSObject();
            response.put("path", directory.getUri().toString());
            response.put("syncedAt", manifest.optString("syncedAt", utcTimestamp()));
            call.resolve(response);
        } catch (Exception error) {
            call.reject(error.getMessage(), error);
        }
    }

    private void uploadLibraryLegacy(PluginCall call) {
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
            call.reject("No sync folder was selected");
            return;
        }

        try {
            DocumentFile directory = requireDirectory(folder);
            DocumentFile manifestFile = directory.findFile(DATA_MANIFEST_FILE);
            if (manifestFile == null || !manifestFile.isFile()) {
                downloadLibraryLegacy(call);
                return;
            }

            JSONObject manifest = readJsonDocument(manifestFile);
            if (!"acta-data-folder".equals(manifest.optString("format"))) {
                throw new IllegalStateException("This is not a valid Acta data folder manifest");
            }
            DocumentFile classificationsFile = requireFile(directory, manifest.optString("classifications", CLASSIFICATIONS_FILE));
            DocumentFile notesDirectory = requireChildDirectory(directory, NOTES_DIRECTORY);
            DocumentFile todosDirectory = requireChildDirectory(directory, TODOS_DIRECTORY);
            JSONObject noteFiles = readNoteFiles(notesDirectory, manifest.optJSONArray("notes"));
            JSONObject todoFiles = readJsonCollection(todosDirectory, manifest.optJSONArray("todos"));

            JSONObject files = new JSONObject();
            files.put(DATA_MANIFEST_FILE, manifest);
            files.put(CLASSIFICATIONS_FILE, readJsonDocument(classificationsFile));
            files.put(NOTES_DIRECTORY, noteFiles);
            files.put(TODOS_DIRECTORY, todoFiles);
            JSONObject bundle = new JSONObject();
            bundle.put("format", "acta-data-folder-bundle");
            bundle.put("version", manifest.optInt("version", 2) >= 3 ? 3 : 2);
            bundle.put("files", files);

            JSObject response = new JSObject();
            response.put("library", JSObject.fromJSONObject(bundle));
            response.put("syncedAt", manifest.optString("syncedAt"));
            response.put("path", directory.getUri().toString());
            call.resolve(response);
        } catch (Exception error) {
            call.reject(error.getMessage(), error);
        }
    }

    private void downloadLibraryLegacy(PluginCall call) {
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
    public void inspectFolder(PluginCall call) {
        String folder = call.getString("folder");
        if (folder == null) {
            call.reject("No sync folder was selected");
            return;
        }
        try {
            DocumentFile directory = requireDirectory(folder);
            JSONArray sample = new JSONArray();
            boolean hasActaData = false;
            boolean empty = true;
            for (DocumentFile child : directory.listFiles()) {
                empty = false;
                String name = child.getName();
                if (DATA_MANIFEST_FILE.equals(name) || SYNC_FILE.equals(name)) hasActaData = true;
                if (name != null && sample.length() < 20) sample.put(name);
            }
            JSObject response = new JSObject();
            response.put("empty", empty);
            response.put("hasActaData", hasActaData);
            response.put("sample", sample);
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

    @PluginMethod
    public void exportAsset(PluginCall call) {
        String fileName = call.getString("fileName", "Acta note");
        String mimeType = call.getString("mimeType", "");
        String dataUrl = call.getString("dataUrl");
        String extension;
        if ("application/pdf".equals(mimeType)) extension = ".pdf";
        else if ("image/png".equals(mimeType)) extension = ".png";
        else if ("image/jpeg".equals(mimeType)) extension = ".jpg";
        else {
            call.reject("不支持该导出格式");
            return;
        }
        String prefix = "data:" + mimeType + ";base64,";
        if (dataUrl == null || !dataUrl.startsWith(prefix) || dataUrl.length() > (MAX_EXPORT_ASSET_BYTES * 4L / 3L) + prefix.length() + 8L) {
            call.reject("导出文件数据无效或超过 64 MB");
            return;
        }
        String safeName = fileName.replaceAll("[\\\\/:*?\"<>|]", "-").replaceAll("\\.[^.]+$", "");
        if (safeName.trim().isEmpty()) safeName = "Acta note";
        safeName += extension;

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, safeName);
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        startActivityForResult(call, intent, "assetExportResult");
    }

    @ActivityCallback
    private void assetExportResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.resolve();
            return;
        }
        try {
            String mimeType = call.getString("mimeType", "");
            String dataUrl = call.getString("dataUrl", "");
            String prefix = "data:" + mimeType + ";base64,";
            if (!dataUrl.startsWith(prefix)) throw new IllegalStateException("导出文件数据无效");
            byte[] bytes = Base64.decode(dataUrl.substring(prefix.length()), Base64.DEFAULT);
            if (bytes.length == 0 || bytes.length > MAX_EXPORT_ASSET_BYTES) throw new IllegalStateException("导出文件数据无效或超过 64 MB");
            Uri uri = data.getData();
            try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new IllegalStateException("无法写入导出文件");
                output.write(bytes);
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

    private JSONObject requireObject(JSONObject parent, String name) {
        JSONObject value = parent.optJSONObject(name);
        if (value == null) throw new IllegalStateException("Missing data folder object: " + name);
        return value;
    }

    private String utcTimestamp() {
        SimpleDateFormat timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        timestamp.setTimeZone(TimeZone.getTimeZone("UTC"));
        return timestamp.format(new Date());
    }

    private DocumentFile getOrCreateDirectory(DocumentFile parent, String name) {
        DocumentFile directory = parent.findFile(name);
        if (directory == null) directory = parent.createDirectory(name);
        if (directory == null || !directory.isDirectory()) {
            throw new IllegalStateException("Cannot create data folder directory: " + name);
        }
        return directory;
    }

    private DocumentFile requireChildDirectory(DocumentFile parent, String name) {
        DocumentFile directory = parent.findFile(name);
        if (directory == null || !directory.isDirectory()) {
            throw new IllegalStateException("Missing data folder directory: " + name);
        }
        return directory;
    }

    private DocumentFile requireFile(DocumentFile parent, String name) {
        if (!CLASSIFICATIONS_FILE.equals(name)) throw new IllegalStateException("Invalid classifications file name");
        DocumentFile file = parent.findFile(name);
        if (file == null || !file.isFile()) throw new IllegalStateException("Missing data folder file: " + name);
        return file;
    }

    private boolean isGeneratedItemFileName(String name) {
        return name != null && name.matches("(?i)^item-[a-f0-9]+\\.(json|md)$");
    }

    private boolean isSafeItemFileName(String name, boolean allowMarkdown) {
        return isGeneratedItemFileName(name) && (allowMarkdown || name.toLowerCase(Locale.US).endsWith(".json"));
    }

    private void writeDocument(DocumentFile directory, String name, String mimeType, String content) throws Exception {
        DocumentFile file = directory.findFile(name);
        if (file == null) file = directory.createFile(mimeType, name);
        if (file == null || !file.isFile()) throw new IllegalStateException("Cannot create data folder file: " + name);
        try (OutputStream output = getContext().getContentResolver().openOutputStream(file.getUri(), "wt")) {
            if (output == null) throw new IllegalStateException("Cannot write data folder file: " + name);
            output.write(content.getBytes(StandardCharsets.UTF_8));
        }
    }

    private Set<String> writeCollection(DocumentFile directory, JSONObject files, boolean allowMarkdown) throws Exception {
        JSONObject collection = files == null ? new JSONObject() : files;
        Set<String> expectedFiles = new HashSet<>();
        Iterator<String> names = collection.keys();
        while (names.hasNext()) {
            String name = names.next();
            if (!isSafeItemFileName(name, allowMarkdown)) throw new IllegalStateException("Invalid item file name: " + name);
            Object value = collection.get(name);
            String content;
            if (value instanceof String) content = (String) value;
            else if (value instanceof JSONObject) content = ((JSONObject) value).toString(2);
            else if (value instanceof JSONArray) content = ((JSONArray) value).toString(2);
            else throw new IllegalStateException("Invalid data folder file contents: " + name);
            String mimeType = name.toLowerCase(Locale.US).endsWith(".md") ? "text/markdown" : "application/json";
            writeDocument(directory, name, mimeType, content);
            expectedFiles.add(name);
        }
        return expectedFiles;
    }

    private void cleanCollection(DocumentFile directory, Set<String> expectedFiles) {
        for (DocumentFile existing : directory.listFiles()) {
            String name = existing.getName();
            if (existing.isFile() && isGeneratedItemFileName(name) && !expectedFiles.contains(name)) existing.delete();
        }
    }

    private String readDocument(DocumentFile file) throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (InputStream input = getContext().getContentResolver().openInputStream(file.getUri())) {
            if (input == null) throw new IllegalStateException("Cannot read data folder file: " + file.getName());
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) {
                if (bytes.size() + count > MAX_SYNC_FILE_BYTES) throw new IllegalStateException("A data folder file exceeds 32 MB");
                bytes.write(buffer, 0, count);
            }
        }
        return bytes.toString(StandardCharsets.UTF_8.name());
    }

    private JSONObject readJsonDocument(DocumentFile file) throws Exception {
        return new JSONObject(readDocument(file));
    }

    private JSONObject readNoteFiles(DocumentFile directory, JSONArray entries) throws Exception {
        JSONObject files = new JSONObject();
        JSONArray collection = entries == null ? new JSONArray() : entries;
        for (int index = 0; index < collection.length(); index++) {
            JSONObject entry = collection.getJSONObject(index);
            if (entry.has("config") && entry.has("markdown")) {
                String configName = entry.getString("config");
                String markdownName = entry.getString("markdown");
                if (!isSafeItemFileName(configName, false) || !isSafeItemFileName(markdownName, true) || !markdownName.toLowerCase(Locale.US).endsWith(".md")) {
                    throw new IllegalStateException("Invalid note file name");
                }
                files.put(configName, readJsonDocument(requireItemFile(directory, configName)));
                files.put(markdownName, readDocument(requireItemFile(directory, markdownName)));
            } else {
                String name = entry.getString("file");
                if (!isSafeItemFileName(name, false)) throw new IllegalStateException("Invalid note file name");
                files.put(name, readJsonDocument(requireItemFile(directory, name)));
            }
        }
        return files;
    }

    private JSONObject readJsonCollection(DocumentFile directory, JSONArray entries) throws Exception {
        JSONObject files = new JSONObject();
        JSONArray collection = entries == null ? new JSONArray() : entries;
        for (int index = 0; index < collection.length(); index++) {
            String name = collection.getJSONObject(index).getString("file");
            if (!isSafeItemFileName(name, false)) throw new IllegalStateException("Invalid item file name: " + name);
            files.put(name, readJsonDocument(requireItemFile(directory, name)));
        }
        return files;
    }

    private DocumentFile requireItemFile(DocumentFile directory, String name) {
        DocumentFile file = directory.findFile(name);
        if (file == null || !file.isFile()) throw new IllegalStateException("Missing data folder item: " + name);
        return file;
    }

    private DocumentFile requireDirectory(String folder) {
        DocumentFile directory = DocumentFile.fromTreeUri(getContext(), Uri.parse(folder));
        if (directory == null || !directory.exists() || !directory.isDirectory()) {
            throw new IllegalStateException("同步文件夹不可用，请重新选择");
        }
        return directory;
    }
}
