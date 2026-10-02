package com.mws.acta;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Acta 局域网同步（协议 v2，Android 原生实现）。
 *
 * 与桌面端 lan_sync.rs 保持同一协议：UDP 广播发现（端口 44117）+ 线程内
 * 极简 HTTP 传输（随机端口）；发现与传输均要求本次服务会话随机生成的
 * session 令牌。推送走两段式确认——先发写入计划、接收端确认后再传数据；
 * 开启「信任此局域网」的设备自动确认。数据读取按需进行：HTTP 服务收到
 * bundle 请求后通过 lanFetch 事件请求数据包打包最新内容。
 */
@CapacitorPlugin(name = "ActaLan")
public class ActaLanPlugin extends Plugin {

    private static final int LAN_PROTOCOL = 2;
    private static final int LAN_DISCOVERY_PORT = 44117;
    private static final String LAN_DISCOVERY_MAGIC = "ACTA-LAN-V2 DISCOVER";
    private static final int LAN_HEADER_LIMIT = 16 * 1024;
    private static final int LAN_BODY_LIMIT = 256 * 1024 * 1024;
    private static final long LAN_DECIDE_WAIT_MS = 150000L;
    private static final long LAN_APPLY_WAIT_MS = 240000L;
    private static final long LAN_FETCH_WAIT_MS = 60000L;
    private static final int LAN_BACKUP_KEEP = 10;
    private static final String DATA_MANIFEST_FILE = "acta-manifest.json";
    private static final String CLASSIFICATIONS_FILE = "classifications.json";

    private LanService service;

    private interface EventSink {
        void accept(String event, JSONObject payload);
    }

    /** 第一阶段写入计划：等待用户在界面中确认（信任网络时跳过）。 */
    private static class IncomingPlan {
        final JSONObject plan;
        final SynchronousQueue<Boolean> ack = new SynchronousQueue<>();

        IncomingPlan(JSONObject plan) {
            this.plan = plan;
        }
    }

    /** 第二阶段：数据已到位，等待前端备份并写入完成。 */
    private static class PendingApply {
        final String token;
        final JSONObject plan;
        byte[] bundle;
        final SynchronousQueue<Boolean> applied = new SynchronousQueue<>();

        PendingApply(String token, JSONObject plan, byte[] bundle) {
            this.token = token;
            this.plan = plan;
            this.bundle = bundle;
        }
    }

    /** 按需读取档案的挂起请求。 */
    private static class FetchRequest {
        final String profileId;
        final SynchronousQueue<JSONObject> response = new SynchronousQueue<>();

        FetchRequest(String profileId) {
            this.profileId = profileId;
        }
    }

    private class LanService {
        final String session = randomToken();
        final int httpPort;
        final boolean discoveryBound;
        final String device;
        final String platform = "android";
        final EventSink sink;
        final Context appContext;
        final AtomicBoolean stop = new AtomicBoolean(false);
        volatile boolean trusted = false;
        volatile JSONArray profiles = new JSONArray();
        ServerSocket listener;
        DatagramSocket udpSocket;
        WifiManager.MulticastLock multicastLock;
        IncomingPlan incoming;
        PendingApply pendingApply;
        final Map<String, FetchRequest> fetches = new LinkedHashMap<>();

        LanService(Context context, EventSink sink, JSONArray profiles, boolean trusted) throws Exception {
            this.appContext = context.getApplicationContext();
            this.sink = sink;
            this.device = deviceName(this.appContext);
            this.profiles = profiles == null ? new JSONArray() : profiles;
            this.trusted = trusted;
            this.listener = new ServerSocket(0);
            this.httpPort = listener.getLocalPort();
            DatagramSocket udp = null;
            try {
                udp = new DatagramSocket(null);
                udp.bind(new java.net.InetSocketAddress(LAN_DISCOVERY_PORT));
            } catch (Exception error) {
                // 端口被占用（同机多实例）：服务仍可用，只是不能被动被发现。
                if (udp != null) udp.close();
                udp = null;
            }
            this.discoveryBound = udp != null;
            this.udpSocket = udp;
            try {
                WifiManager wifi = (WifiManager) this.appContext.getSystemService(Context.WIFI_SERVICE);
                if (wifi != null) {
                    multicastLock = wifi.createMulticastLock("acta-lan");
                    multicastLock.setReferenceCounted(false);
                    multicastLock.acquire();
                }
            } catch (Exception ignored) {
                // 无 Wi-Fi 服务或权限受限时静默降级。
            }
        }

        void start() {
            if (discoveryBound) {
                Thread udpThread = new Thread(this::runDiscoveryResponder, "acta-lan-udp");
                udpThread.setDaemon(true);
                udpThread.start();
            }
            Thread httpThread = new Thread(this::runHttpServer, "acta-lan-http");
            httpThread.setDaemon(true);
            httpThread.start();
        }

        void shutdown() {
            stop.set(true);
            try {
                if (listener != null) listener.close();
            } catch (Exception ignored) {
            }
            try {
                if (udpSocket != null) udpSocket.close();
            } catch (Exception ignored) {
            }
            if (multicastLock != null) {
                try {
                    multicastLock.release();
                } catch (Exception ignored) {
                }
            }
            synchronized (this) {
                if (incoming != null) incoming.ack.offer(Boolean.FALSE);
                if (pendingApply != null) pendingApply.applied.offer(Boolean.FALSE);
                incoming = null;
                pendingApply = null;
                fetches.clear();
            }
        }

        synchronized void updateMeta(JSONArray nextProfiles, boolean nextTrusted) {
            if (nextProfiles != null) profiles = nextProfiles;
            trusted = nextTrusted;
        }

        private void runDiscoveryResponder() {
            byte[] buffer = new byte[4096];
            while (!stop.get()) {
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                try {
                    udpSocket.receive(packet);
                } catch (SocketTimeoutException ignored) {
                    continue;
                } catch (Exception error) {
                    break;
                }
                try {
                    String request = new String(packet.getData(), 0, packet.getLength(), StandardCharsets.UTF_8).trim();
                    if (!request.startsWith(LAN_DISCOVERY_MAGIC)) continue;
                    String token = request.substring(LAN_DISCOVERY_MAGIC.length()).trim();
                    if (token.isEmpty() || token.length() > 64 || token.matches(".*\\s.*")) continue;
                    JSONObject response = new JSONObject();
                    response.put("app", "acta");
                    response.put("protocol", LAN_PROTOCOL);
                    response.put("token", token);
                    response.put("session", session);
                    response.put("name", device);
                    response.put("platform", platform);
                    response.put("port", httpPort);
                    response.put("trusted", trusted);
                    response.put("profiles", profiles);
                    byte[] payload = response.toString().getBytes(StandardCharsets.UTF_8);
                    udpSocket.send(new DatagramPacket(payload, payload.length, packet.getAddress(), packet.getPort()));
                } catch (Exception ignored) {
                    // 单个请求失败不影响服务。
                }
            }
        }

        private void runHttpServer() {
            while (!stop.get()) {
                final Socket socket;
                try {
                    socket = listener.accept();
                } catch (SocketTimeoutException ignored) {
                    continue;
                } catch (Exception error) {
                    break;
                }
                Thread connection = new Thread(() -> handleConnection(socket), "acta-lan-conn");
                connection.setDaemon(true);
                connection.start();
            }
        }

        synchronized String acceptPlan(JSONObject plan) {
            // 旧的待写入计划会被新的替代，避免发送方中断后残留阻塞后续传输。
            if (pendingApply != null) pendingApply.applied.offer(Boolean.FALSE);
            String token = randomToken();
            pendingApply = new PendingApply(token, plan, null);
            return token;
        }
    }

    private String deviceName(Context context) {
        try {
            String name = Settings.Global.getString(context.getContentResolver(), "device_name");
            if (name != null && !name.trim().isEmpty()) return name.trim();
        } catch (Exception ignored) {
        }
        String model = Build.MODEL == null ? "" : Build.MODEL.trim();
        return model.isEmpty() ? "Acta" : model;
    }

    private static String randomToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private static JSObject metaJson(LanService current) {
        JSObject meta = new JSObject();
        meta.put("running", current != null);
        meta.put("discoverable", current != null && current.discoveryBound);
        meta.put("port", current == null ? 0 : current.httpPort);
        meta.put("session", current == null ? "" : current.session);
        meta.put("device", current == null ? "Acta" : current.device);
        meta.put("platform", current == null ? "android" : current.platform);
        meta.put("trusted", current != null && current.trusted);
        meta.put("profiles", current == null ? new JSONArray() : current.profiles);
        return meta;
    }

    private synchronized LanService currentService() {
        return service;
    }

    private void startOrUpdate(PluginCall call, boolean start) {
        JSONArray profiles = call.getArray("profiles");
        boolean trusted = Boolean.TRUE.equals(call.getBoolean("trusted"));
        synchronized (this) {
            LanService current = service;
            if (current != null) {
                current.updateMeta(profiles, trusted);
                call.resolve(metaJson(current));
                return;
            }
            if (!start) {
                call.resolve(metaJson(null));
                return;
            }
            try {
                service = new LanService(getContext().getApplicationContext(), (event, payload) -> {
                    try {
                        notifyListeners(event, JSObject.fromJSONObject(payload));
                    } catch (Exception ignored) {
                    }
                }, profiles, trusted);
            } catch (Exception error) {
                service = null;
                call.reject("无法启动局域网同步服务：" + error.getMessage());
                return;
            }
            service.start();
            call.resolve(metaJson(service));
        }
    }

    @PluginMethod
    public void startService(PluginCall call) {
        startOrUpdate(call, true);
    }

    @PluginMethod
    public void updateMeta(PluginCall call) {
        startOrUpdate(call, false);
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        synchronized (this) {
            if (service != null) {
                service.shutdown();
                service = null;
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void serviceStatus(PluginCall call) {
        synchronized (this) {
            call.resolve(metaJson(service));
        }
    }

    @PluginMethod
    public void discover(final PluginCall call) {
        final String ownSession;
        synchronized (this) {
            ownSession = service == null ? "" : service.session;
        }
        final int timeout = Math.max(400, Math.min(5000, call.getInt("timeoutMs", 1800)));
        Thread worker = new Thread(() -> {
            Map<String, JSONObject> peers = new LinkedHashMap<>();
            DatagramSocket socket = null;
            try {
                socket = new DatagramSocket();
                socket.setBroadcast(true);
                socket.setSoTimeout(200);
                String token = randomToken();
                byte[] message = (LAN_DISCOVERY_MAGIC + " " + token).getBytes(StandardCharsets.UTF_8);
                List<InetAddress> targets = new ArrayList<>();
                try {
                    targets.add(InetAddress.getByName("255.255.255.255"));
                } catch (Exception ignored) {
                }
                try {
                    for (NetworkInterface networkInterface : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                        for (InterfaceAddress address : networkInterface.getInterfaceAddresses()) {
                            InetAddress broadcast = address.getBroadcast();
                            if (broadcast != null && !targets.contains(broadcast)) targets.add(broadcast);
                        }
                    }
                } catch (Exception ignored) {
                }
                try {
                    targets.add(InetAddress.getByName("127.0.0.1"));
                } catch (Exception ignored) {
                }
                for (InetAddress target : targets) {
                    try {
                        socket.send(new DatagramPacket(message, message.length, target, LAN_DISCOVERY_PORT));
                    } catch (Exception ignored) {
                    }
                }
                long deadline = System.currentTimeMillis() + timeout;
                byte[] buffer = new byte[8192];
                while (System.currentTimeMillis() < deadline) {
                    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                    try {
                        socket.receive(packet);
                    } catch (SocketTimeoutException ignored) {
                        continue;
                    }
                    try {
                        JSONObject payload = new JSONObject(new String(packet.getData(), 0, packet.getLength(), StandardCharsets.UTF_8));
                        if (!"acta".equals(payload.optString("app"))) continue;
                        if (payload.optInt("protocol") != LAN_PROTOCOL) continue;
                        if (!token.equals(payload.optString("token"))) continue;
                        String session = payload.optString("session", "");
                        if (session.isEmpty() || session.equals(ownSession)) continue;
                        int port = payload.optInt("port", 0);
                        if (port == 0) continue;
                        String key = packet.getAddress().getHostAddress() + ":" + port;
                        if (!peers.containsKey(key)) {
                            JSONObject peer = new JSONObject();
                            peer.put("ip", packet.getAddress().getHostAddress());
                            peer.put("port", port);
                            peer.put("session", session);
                            peer.put("name", payload.optString("name", "Acta"));
                            peer.put("platform", payload.optString("platform", ""));
                            peer.put("trusted", payload.optBoolean("trusted", false));
                            JSONArray profiles = payload.optJSONArray("profiles");
                            peer.put("profiles", profiles == null ? new JSONArray() : profiles);
                            peers.put(key, peer);
                        }
                    } catch (Exception ignored) {
                    }
                }
            } catch (Exception error) {
                if (socket != null) socket.close();
                call.reject("无法发起局域网搜索：" + error.getMessage());
                return;
            }
            if (socket != null) socket.close();
            JSONArray array = new JSONArray();
            for (JSONObject peer : peers.values()) array.put(peer);
            JSObject response = new JSObject();
            response.put("peers", array);
            call.resolve(response);
        }, "acta-lan-discover");
        worker.setDaemon(true);
        worker.start();
    }

    private void peerGet(final PluginCall call, final String url, final long timeoutMs, final String wrapKey) {
        Thread worker = new Thread(() -> {
            try {
                HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setConnectTimeout(5000);
                connection.setReadTimeout((int) timeoutMs);
                connection.setRequestMethod("GET");
                int status = connection.getResponseCode();
                String body = readStream(status >= 400 ? connection.getErrorStream() : connection.getInputStream());
                connection.disconnect();
                if (status != 200) {
                    call.reject(httpError(status, body));
                    return;
                }
                JSONObject payload = new JSONObject(body);
                if (!"acta".equals(payload.optString("app"))) {
                    call.reject("对方不是有效的 Acta 设备。");
                    return;
                }
                JSObject response = new JSObject();
                response.put(wrapKey, payload);
                call.resolve(response);
            } catch (Exception error) {
                call.reject("无法连接该设备：" + error.getMessage());
            }
        }, "acta-lan-get");
        worker.setDaemon(true);
        worker.start();
    }

    @PluginMethod
    public void fetchInfo(final PluginCall call) {
        final String ip = call.getString("ip", "");
        final int port = call.getInt("port", 0);
        final String session = call.getString("session", "");
        peerGet(call, peerUrl(ip, port, "info", session), 180000L, "info");
    }

    @PluginMethod
    public void fetchProfileBundle(final PluginCall call) {
        final String ip = call.getString("ip", "");
        final int port = call.getInt("port", 0);
        final String session = call.getString("session", "");
        final String profileId = call.getString("profileId", "");
        String encoded = profileId;
        try {
            encoded = URLEncoder.encode(profileId, "UTF-8");
        } catch (Exception ignored) {
        }
        final String url = peerUrl(ip, port, "bundle", session) + "&profile=" + encoded;
        Thread worker = new Thread(() -> {
            try {
                HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setConnectTimeout(5000);
                connection.setReadTimeout((int) (LAN_FETCH_WAIT_MS + 30000L));
                connection.setRequestMethod("GET");
                int status = connection.getResponseCode();
                String body = readStream(status >= 400 ? connection.getErrorStream() : connection.getInputStream());
                connection.disconnect();
                if (status != 200) {
                    call.reject(httpError(status, body));
                    return;
                }
                JSONObject bundle = new JSONObject(body);
                if (!bundleShapeValid(bundle)) {
                    call.reject("对方返回的不是有效的 Acta 完整数据档案。");
                    return;
                }
                JSObject response = new JSObject();
                response.put("bundle", bundle);
                call.resolve(response);
            } catch (Exception error) {
                call.reject("无法连接该设备：" + error.getMessage());
            }
        }, "acta-lan-fetch-profile");
        worker.setDaemon(true);
        worker.start();
    }

    @PluginMethod
    public void pushPlan(final PluginCall call) {
        final String ip = call.getString("ip", "");
        final int port = call.getInt("port", 0);
        final String session = call.getString("session", "");
        final JSONObject plan = call.getObject("plan");
        if (plan == null) {
            call.reject("缺少写入计划");
            return;
        }
        Thread worker = new Thread(() -> {
            try {
                HttpURLConnection connection = (HttpURLConnection) new URL(peerUrl(ip, port, "plan", session)).openConnection();
                connection.setConnectTimeout(5000);
                connection.setReadTimeout((int) (LAN_DECIDE_WAIT_MS + 30000L));
                connection.setRequestMethod("PUT");
                connection.setDoOutput(true);
                byte[] body = plan.toString().getBytes(StandardCharsets.UTF_8);
                connection.setFixedLengthStreamingMode(body.length);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(body);
                    output.flush();
                }
                int status = connection.getResponseCode();
                String responseBody = readStream(status >= 400 ? connection.getErrorStream() : connection.getInputStream());
                connection.disconnect();
                if (status != 200) {
                    call.reject(httpError(status, responseBody));
                    return;
                }
                JSONObject parsed = new JSONObject(responseBody);
                String token = parsed.optString("token", "");
                if (token.isEmpty()) {
                    call.reject("对方接受了请求但未返回有效凭据。");
                    return;
                }
                JSObject response = new JSObject();
                response.put("token", token);
                call.resolve(response);
            } catch (Exception error) {
                call.reject("无法连接该设备：" + error.getMessage());
            }
        }, "acta-lan-push-plan");
        worker.setDaemon(true);
        worker.start();
    }

    @PluginMethod
    public void pushData(final PluginCall call) {
        final String ip = call.getString("ip", "");
        final int port = call.getInt("port", 0);
        final String session = call.getString("session", "");
        final String token = call.getString("token", "");
        final JSONObject bundle = call.getObject("bundle");
        if (token.isEmpty() || bundle == null) {
            call.reject("缺少传输令牌或数据");
            return;
        }
        Thread worker = new Thread(() -> {
            try {
                HttpURLConnection connection = (HttpURLConnection) new URL(peerUrl(ip, port, "data", session) + "&plan=" + token).openConnection();
                connection.setConnectTimeout(5000);
                connection.setReadTimeout((int) (LAN_APPLY_WAIT_MS + 30000L));
                connection.setRequestMethod("PUT");
                connection.setDoOutput(true);
                byte[] body = bundle.toString().getBytes(StandardCharsets.UTF_8);
                connection.setFixedLengthStreamingMode(body.length);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(body);
                    output.flush();
                }
                int status = connection.getResponseCode();
                String responseBody = readStream(status >= 400 ? connection.getErrorStream() : connection.getInputStream());
                connection.disconnect();
                if (status != 200) {
                    call.reject(httpError(status, responseBody));
                    return;
                }
                JSONObject parsed = new JSONObject(responseBody);
                if (!"applied".equals(parsed.optString("status"))) {
                    call.reject("对方写入数据失败。");
                    return;
                }
                JSObject response = new JSObject();
                response.put("applied", true);
                call.resolve(response);
            } catch (Exception error) {
                call.reject("无法连接该设备：" + error.getMessage());
            }
        }, "acta-lan-push-data");
        worker.setDaemon(true);
        worker.start();
    }

    @PluginMethod
    public void decideIncoming(PluginCall call) {
        boolean accept = Boolean.TRUE.equals(call.getBoolean("accept"));
        String token = "";
        synchronized (this) {
            LanService current = service;
            if (current == null) {
                call.reject("局域网同步服务未运行");
                return;
            }
            synchronized (current) {
                IncomingPlan incoming = current.incoming;
                if (incoming == null) {
                    call.reject("当前没有待确认的同步请求");
                    return;
                }
                current.incoming = null;
                if (accept) token = current.acceptPlan(incoming.plan);
                incoming.ack.offer(accept);
            }
        }
        JSObject response = new JSObject();
        response.put("token", token);
        call.resolve(response);
    }

    @PluginMethod
    public void provideBundle(PluginCall call) {
        String requestId = call.getString("requestId", "");
        boolean ok = Boolean.TRUE.equals(call.getBoolean("ok"));
        synchronized (this) {
            LanService current = service;
            if (current == null) {
                call.reject("局域网同步服务未运行");
                return;
            }
            FetchRequest request = current.fetches.remove(requestId);
            if (request == null) {
                call.reject("没有对应的读取请求");
                return;
            }
            JSONObject result = new JSONObject();
            try {
                result.put("ok", ok);
                if (ok) result.put("bundle", call.getObject("bundle") == null ? JSONObject.NULL : call.getObject("bundle"));
                else result.put("error", call.getString("error", "档案不可用"));
            } catch (JSONException ignored) {
            }
            request.response.offer(result);
        }
        call.resolve();
    }

    @PluginMethod
    public void acceptIncoming(PluginCall call) {
        synchronized (this) {
            LanService current = service;
            if (current == null) {
                call.reject("局域网同步服务未运行");
                return;
            }
            synchronized (current) {
                PendingApply pending = current.pendingApply;
                if (pending == null) {
                    call.reject("当前没有待写入的同步数据");
                    return;
                }
                if (pending.bundle == null) {
                    call.reject("数据尚未到位");
                    return;
                }
                try {
                    JSONObject parsed = new JSONObject(new String(pending.bundle, StandardCharsets.UTF_8));
                    call.resolve(JSObject.fromJSONObject(parsed));
                } catch (Exception error) {
                    call.reject("数据无效：" + error.getMessage());
                }
                pending.bundle = null;
            }
        }
    }

    @PluginMethod
    public void confirmIncoming(PluginCall call) {
        synchronized (this) {
            LanService current = service;
            if (current == null) {
                call.reject("局域网同步服务未运行");
                return;
            }
            synchronized (current) {
                PendingApply pending = current.pendingApply;
                if (pending != null) {
                    current.pendingApply = null;
                    pending.applied.offer(Boolean.TRUE);
                }
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void rejectIncoming(PluginCall call) {
        synchronized (this) {
            LanService current = service;
            if (current == null) {
                call.reject("局域网同步服务未运行");
                return;
            }
            synchronized (current) {
                PendingApply pending = current.pendingApply;
                if (pending != null) {
                    current.pendingApply = null;
                    pending.applied.offer(Boolean.FALSE);
                    call.resolve();
                    return;
                }
                IncomingPlan incoming = current.incoming;
                if (incoming != null) {
                    current.incoming = null;
                    incoming.ack.offer(Boolean.FALSE);
                }
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void backupLocal(final PluginCall call) {
        final JSONObject bundle = call.getObject("bundle");
        final String profileName = call.getString("profileName", "行记数据");
        if (bundle == null) {
            call.reject("这不是有效的 Acta 完整数据档案");
            return;
        }
        Thread worker = new Thread(() -> {
            try {
                Context context = getContext().getApplicationContext();
                File base = context.getExternalFilesDir(null);
                if (base == null) base = context.getFilesDir();
                File backups = new File(new File(base, "backups"), "lan-sync");
                if (!backups.exists() && !backups.mkdirs()) {
                    call.reject("无法创建备份文件夹");
                    return;
                }
                String stamp = new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.ROOT).format(new Date());
                String profile = sanitizedProfileName(profileName);
                File directory = new File(backups, "lan-" + stamp + "-" + profile);
                int suffix = 2;
                while (directory.exists()) {
                    directory = new File(backups, "lan-" + stamp + "-" + suffix + "-" + profile);
                    suffix++;
                }
                if (!directory.mkdirs()) {
                    call.reject("无法创建备份文件夹");
                    return;
                }
                writeBundleFiles(directory, bundle);
                pruneOldBackups(backups);
                long bytes = directorySize(directory);
                JSONObject files = bundle.optJSONObject("files");
                JSONObject manifest = files == null ? null : files.optJSONObject(DATA_MANIFEST_FILE);
                JSObject response = new JSObject();
                response.put("path", directory.getAbsolutePath());
                response.put("notes", manifest == null ? 0 : manifest.optJSONArray("notes") == null ? 0 : manifest.optJSONArray("notes").length());
                response.put("todos", manifest == null ? 0 : manifest.optJSONArray("todos") == null ? 0 : manifest.optJSONArray("todos").length());
                response.put("bytes", bytes);
                response.put("createdAt", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.ROOT).format(new Date()));
                call.resolve(response);
            } catch (Exception error) {
                call.reject("备份失败：" + error.getMessage());
            }
        }, "acta-lan-backup");
        worker.setDaemon(true);
        worker.start();
    }

    // ---------- HTTP 服务内部 ----------

    private void handleConnection(Socket socket) {
        try {
            socket.setSoTimeout(15000);
            RequestHead head = readHead(socket.getInputStream());
            if (head == null || head.query == null) {
                respond(socket, 400, "Bad Request", "{\"error\":\"bad request\"}");
                return;
            }
            LanService current = service;
            if (current == null) {
                respond(socket, 503, "Service Unavailable", "{\"error\":\"unavailable\"}");
                return;
            }
            String expected = "session=" + current.session;
            boolean authorized = false;
            for (String pair : head.query.split("&")) {
                if (pair.equals(expected)) {
                    authorized = true;
                    break;
                }
            }
            if (!authorized) {
                JSONObject payload = new JSONObject();
                try {
                    payload.put("ip", socket.getInetAddress() == null ? "" : socket.getInetAddress().getHostAddress());
                } catch (JSONException ignored) {
                }
                sink().accept("lanRejected", payload);
                respond(socket, 403, "Forbidden", "{\"error\":\"forbidden\"}");
                return;
            }
            switch (head.method) {
                case "GET":
                    if ("/acta-lan/v2/info".equals(head.path)) {
                        synchronized (this) {
                            respond(socket, 200, "OK", metaJson(current).toString());
                        }
                    } else if ("/acta-lan/v2/bundle".equals(head.path)) {
                        handleProfileFetch(socket, current, head.query);
                    } else {
                        respond(socket, 404, "Not Found", "{\"error\":\"not found\"}");
                    }
                    return;
                case "PUT":
                    if ("/acta-lan/v2/plan".equals(head.path)) {
                        handlePushPlan(socket, current, head.contentLength);
                    } else if ("/acta-lan/v2/data".equals(head.path)) {
                        handlePushData(socket, current, head.contentLength, head.query);
                    } else {
                        respond(socket, 404, "Not Found", "{\"error\":\"not found\"}");
                    }
                    return;
                default:
                    respond(socket, 405, "Method Not Allowed", "{\"error\":\"method not allowed\"}");
            }
        } catch (Exception ignored) {
        } finally {
            try {
                socket.close();
            } catch (Exception ignored) {
            }
        }
    }

    private EventSink sink() {
        return (event, payload) -> {
            try {
                notifyListeners(event, JSObject.fromJSONObject(payload));
            } catch (Exception ignored) {
            }
        };
    }

    private void handleProfileFetch(Socket socket, LanService current, String query) throws Exception {
        if (!current.trusted) {
            respond(socket, 403, "Forbidden", "{\"error\":\"untrusted\"}");
            return;
        }
        String profileId = queryParam(query, "profile");
        if (profileId == null || profileId.isEmpty() || profileId.length() > 120) {
            respond(socket, 400, "Bad Request", "{\"error\":\"bad profile\"}");
            return;
        }
        FetchRequest request = new FetchRequest(profileId);
        String requestId = randomToken();
        synchronized (current) {
            current.fetches.put(requestId, request);
        }
        JSONObject payload = new JSONObject();
        payload.put("requestId", requestId);
        payload.put("profileId", profileId);
        sink().accept("lanFetch", payload);
        JSONObject result = request.response.poll(LAN_FETCH_WAIT_MS, TimeUnit.MILLISECONDS);
        if (result == null) {
            synchronized (current) {
                current.fetches.remove(requestId);
            }
            respond(socket, 408, "Request Timeout", "{\"error\":\"timeout\"}");
            return;
        }
        if (!result.optBoolean("ok", false)) {
            JSONObject error = new JSONObject();
            error.put("error", result.optString("error", "档案不可用"));
            respond(socket, 404, "Not Found", error.toString());
            return;
        }
        JSONObject bundle = result.optJSONObject("bundle");
        if (bundle == null) {
            respond(socket, 500, "Internal Server Error", "{\"error\":\"unavailable\"}");
            return;
        }
        respond(socket, 200, "OK", bundle.toString());
    }

    private void handlePushPlan(Socket socket, LanService current, int contentLength) throws Exception {
        byte[] body = readBody(socket, contentLength, false);
        if (body == null) {
            respond(socket, 413, "Payload Too Large", "{\"error\":\"too large\"}");
            return;
        }
        JSONObject payload;
        try {
            payload = new JSONObject(new String(body, StandardCharsets.UTF_8));
        } catch (Exception error) {
            respond(socket, 400, "Bad Request", "{\"error\":\"invalid payload\"}");
            return;
        }
        final JSONObject plan = parsePlan(payload);
        if (plan == null) {
            respond(socket, 400, "Bad Request", "{\"error\":\"invalid plan\"}");
            return;
        }
        boolean trustedNow = current.trusted;
        IncomingPlan incoming = new IncomingPlan(plan);
        synchronized (current) {
            if (current.incoming != null) {
                respond(socket, 409, "Conflict", "{\"error\":\"pending\"}");
                return;
            }
            current.incoming = incoming;
        }
        sink().accept("lanIncoming", incomingEvent(plan, trustedNow));

        if (trustedNow) {
            // 信任网络：不做任何等待，直接进入待写入状态并接受。
            String token = current.acceptPlan(plan);
            respond(socket, 200, "OK", "{\"status\":\"accepted\",\"token\":\"" + token + "\"}");
            return;
        }
        Boolean ack = incoming.ack.poll(LAN_DECIDE_WAIT_MS, TimeUnit.MILLISECONDS);
        if (ack == null) {
            synchronized (current) {
                if (current.incoming == incoming) current.incoming = null;
            }
            respond(socket, 408, "Request Timeout", "{\"status\":\"timeout\"}");
            return;
        }
        if (!ack) {
            respond(socket, 403, "Forbidden", "{\"status\":\"refused\"}");
            return;
        }
        String token;
        synchronized (current) {
            token = current.pendingApply == null ? "" : current.pendingApply.token;
        }
        respond(socket, 200, "OK", "{\"status\":\"accepted\",\"token\":\"" + token + "\"}");
    }

    private void handlePushData(Socket socket, LanService current, int contentLength, String query) throws Exception {
        String expectedToken = queryParam(query, "plan");
        synchronized (current) {
            if (expectedToken == null || expectedToken.isEmpty() || current.pendingApply == null
                || !expectedToken.equals(current.pendingApply.token)) {
                respond(socket, 409, "Conflict", "{\"error\":\"no matching plan\"}");
                return;
            }
        }
        byte[] body = readBody(socket, contentLength, true);
        if (body == null) {
            respond(socket, 413, "Payload Too Large", "{\"error\":\"too large\"}");
            return;
        }
        JSONObject bundle;
        try {
            bundle = new JSONObject(new String(body, StandardCharsets.UTF_8));
        } catch (Exception error) {
            respond(socket, 400, "Bad Request", "{\"error\":\"invalid payload\"}");
            return;
        }
        if (!bundleShapeValid(bundle)) {
            respond(socket, 400, "Bad Request", "{\"error\":\"invalid bundle\"}");
            return;
        }
        final PendingApply pending;
        synchronized (current) {
            pending = current.pendingApply;
            if (pending == null || !expectedToken.equals(pending.token) || pending.bundle != null) {
                respond(socket, 409, "Conflict", "{\"error\":\"no matching plan\"}");
                return;
            }
            pending.bundle = body;
        }
        JSONObject event = new JSONObject();
        JSONObject from = new JSONObject();
        from.put("name", pending.plan.optString("device", "Acta"));
        from.put("platform", pending.plan.optString("platform", ""));
        event.put("from", from);
        event.put("profile", pending.plan.optString("profile", ""));
        event.put("mode", pending.plan.optString("mode", ""));
        event.put("targetProfileId", pending.plan.optString("targetProfileId", ""));
        event.put("targetProfileName", pending.plan.optString("targetProfileName", ""));
        event.put("notes", pending.plan.optInt("notes", 0));
        event.put("todos", pending.plan.optInt("todos", 0));
        event.put("classifications", pending.plan.optInt("classifications", 0));
        sink().accept("lanData", event);
        Boolean applied = pending.applied.poll(LAN_APPLY_WAIT_MS, TimeUnit.MILLISECONDS);
        if (applied == null) {
            // 写入超时：清掉这个已过期的计划，避免阻塞后续传输。
            synchronized (current) {
                if (current.pendingApply == pending) current.pendingApply = null;
            }
            respond(socket, 408, "Request Timeout", "{\"status\":\"timeout\"}");
            return;
        }
        if (applied) {
            respond(socket, 200, "OK", "{\"status\":\"applied\"}");
        } else {
            respond(socket, 200, "OK", "{\"status\":\"failed\"}");
        }
    }

    private JSONObject incomingEvent(JSONObject plan, boolean auto) throws JSONException {
        JSONObject event = new JSONObject();
        event.put("auto", auto);
        JSONObject from = new JSONObject();
        from.put("name", plan.optString("device", "Acta"));
        from.put("platform", plan.optString("platform", ""));
        event.put("from", from);
        event.put("profile", plan.optString("profile", ""));
        event.put("mode", plan.optString("mode", ""));
        event.put("targetProfileId", plan.optString("targetProfileId", ""));
        event.put("targetProfileName", plan.optString("targetProfileName", ""));
        event.put("notes", plan.optInt("notes", 0));
        event.put("todos", plan.optInt("todos", 0));
        event.put("classifications", plan.optInt("classifications", 0));
        return event;
    }

    private JSONObject parsePlan(JSONObject payload) {
        try {
            String mode = payload.getString("mode");
            if (!"replace".equals(mode) && !"copy".equals(mode)) return null;
            String targetProfileId = payload.optString("targetProfileId", "");
            if ("replace".equals(mode) && targetProfileId.isEmpty()) return null;
            JSONObject plan = new JSONObject();
            plan.put("device", payload.optString("device", "Acta"));
            plan.put("platform", payload.optString("platform", ""));
            plan.put("profile", payload.optString("profile", ""));
            plan.put("mode", mode);
            plan.put("targetProfileId", targetProfileId);
            plan.put("targetProfileName", payload.optString("targetProfileName", ""));
            plan.put("notes", payload.optInt("notes", 0));
            plan.put("todos", payload.optInt("todos", 0));
            plan.put("classifications", payload.optInt("classifications", 0));
            return plan;
        } catch (JSONException error) {
            return null;
        }
    }

    private static boolean bundleShapeValid(JSONObject bundle) {
        if (bundle == null || !"acta-data-folder-bundle".equals(bundle.optString("format", ""))) return false;
        JSONObject files = bundle.optJSONObject("files");
        return files != null && files.has(DATA_MANIFEST_FILE) && files.has(CLASSIFICATIONS_FILE);
    }

    private static String queryParam(String query, String name) {
        for (String pair : query.split("&")) {
            if (pair.startsWith(name + "=")) return pair.substring(name.length() + 1);
        }
        return null;
    }

    private static String httpError(int status, String body) {
        if (status == 403) {
            if (body != null && body.contains("untrusted")) return "对方未开启「信任此局域网」，无法直接获取其行记数据。";
            return "对方拒绝了这次同步；若对方近期重启过 Acta 或重新开过「允许被发现」，请重新搜索设备后再试。";
        }
        switch (status) {
            case 404:
                return "对方设备上没有该数据。";
            case 408:
                return "对方没有及时响应这次同步。";
            case 409:
                return "对方已有一个同步请求待处理。";
            case 413:
                return "数据超出局域网同步的大小限制（256 MB）。";
            default:
                return "对方返回了错误状态（" + status + "）。";
        }
    }

    private static String peerUrl(String ip, int port, String path, String session) {
        return "http://" + ip + ":" + port + "/acta-lan/v" + LAN_PROTOCOL + "/" + path + "?session=" + session;
    }

    private static String readStream(InputStream input) throws Exception {
        if (input == null) return "";
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[64 * 1024];
        int read;
        while ((read = input.read(buffer)) >= 0) output.write(buffer, 0, read);
        input.close();
        return output.toString("UTF-8");
    }

    private byte[] readBody(Socket socket, int length, boolean progress) throws Exception {
        if (length < 0 || length > LAN_BODY_LIMIT) return null;
        InputStream input = socket.getInputStream();
        ByteArrayOutputStream output = new ByteArrayOutputStream(Math.min(length, 8 * 1024 * 1024));
        byte[] chunk = new byte[64 * 1024];
        int received = 0;
        long lastEmit = 0;
        while (received < length) {
            int read = input.read(chunk, 0, Math.min(chunk.length, length - received));
            if (read < 0) return null;
            output.write(chunk, 0, read);
            received += read;
            long now = System.currentTimeMillis();
            if (progress && now - lastEmit >= 150) {
                lastEmit = now;
                try {
                    JSONObject payload = new JSONObject();
                    payload.put("direction", "receive");
                    payload.put("received", received);
                    payload.put("total", length);
                    sink().accept("lanProgress", payload);
                } catch (Exception ignored) {
                }
            }
        }
        return output.toByteArray();
    }

    private static class RequestHead {
        String method;
        String path;
        String query;
        int contentLength = -1;
    }

    private static RequestHead readHead(InputStream input) throws Exception {
        ByteArrayOutputStream head = new ByteArrayOutputStream();
        final String terminator = "\r\n\r\n";
        int matched = 0;
        int current;
        while ((current = input.read()) >= 0) {
            head.write(current);
            matched = current == terminator.charAt(matched) ? matched + 1 : (current == '\r' ? 1 : 0);
            if (matched == 4) break;
            if (head.size() > LAN_HEADER_LIMIT) return null;
        }
        if (matched < 4) return null;
        String text = head.toString("UTF-8");
        String[] lines = text.split("\r\n");
        if (lines.length == 0) return null;
        String[] parts = lines[0].trim().split("\\s+");
        if (parts.length < 2) return null;
        RequestHead result = new RequestHead();
        result.method = parts[0].toUpperCase(Locale.ROOT);
        String target = parts[1];
        int queryIndex = target.indexOf('?');
        if (queryIndex >= 0) {
            result.path = target.substring(0, queryIndex);
            result.query = target.substring(queryIndex + 1);
        } else {
            result.path = target;
            result.query = "";
        }
        for (String line : lines) {
            int colon = line.indexOf(':');
            if (colon > 0 && "content-length".equalsIgnoreCase(line.substring(0, colon).trim())) {
                try {
                    result.contentLength = Integer.parseInt(line.substring(colon + 1).trim());
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return result;
    }

    private static void respond(Socket socket, int status, String reason, String body) {
        try {
            if (!socket.isConnected()) return;
            byte[] payload = body.getBytes(StandardCharsets.UTF_8);
            String header = "HTTP/1.1 " + status + " " + reason
                + "\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: "
                + payload.length + "\r\nConnection: close\r\n\r\n";
            OutputStream output = socket.getOutputStream();
            output.write(header.getBytes(StandardCharsets.UTF_8));
            output.write(payload);
            output.flush();
        } catch (Exception ignored) {
        }
    }

    // ---------- 备份 ----------

    private static String sanitizedProfileName(String profile) {
        StringBuilder sanitized = new StringBuilder();
        for (char character : profile.toCharArray()) {
            if (Character.isISOControl(character) || "<>:\"/\\|?*".indexOf(character) >= 0) sanitized.append('_');
            else sanitized.append(character);
        }
        String trimmed = sanitized.toString().trim();
        if (trimmed.isEmpty()) return "行记数据";
        return trimmed.length() > 40 ? trimmed.substring(0, 40) : trimmed;
    }

    private static void writeBundleFiles(File directory, JSONObject bundle) throws Exception {
        JSONObject files = bundle.optJSONObject("files");
        if (files == null) throw new Exception("数据包缺少 files 字段");
        Iterator<String> keys = files.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            File file = new File(directory, key);
            File parent = file.getParentFile();
            if (parent != null && !parent.exists() && !parent.mkdirs()) throw new Exception("无法创建备份子文件夹：" + key);
            Object value = files.get(key);
            String content = value instanceof String ? (String) value : String.valueOf(value);
            try (FileOutputStream output = new FileOutputStream(file)) {
                output.write(content.getBytes(StandardCharsets.UTF_8));
            }
        }
    }

    private static long directorySize(File directory) {
        long total = 0;
        File[] entries = directory.listFiles();
        if (entries == null) return 0;
        for (File entry : entries) {
            if (entry.isDirectory()) total += directorySize(entry);
            else total += entry.length();
        }
        return total;
    }

    private static void pruneOldBackups(File backups) {
        File[] entries = backups.listFiles();
        if (entries == null || entries.length <= LAN_BACKUP_KEEP) return;
        List<File> directories = new ArrayList<>();
        for (File entry : entries) {
            if (entry.isDirectory() && entry.getName().startsWith("lan-")) directories.add(entry);
        }
        if (directories.size() <= LAN_BACKUP_KEEP) return;
        directories.sort((left, right) -> Long.compare(left.lastModified(), right.lastModified()));
        int removeCount = directories.size() - LAN_BACKUP_KEEP;
        for (int index = 0; index < removeCount; index++) {
            deleteRecursively(directories.get(index));
        }
    }

    private static void deleteRecursively(File file) {
        File[] children = file.listFiles();
        if (children != null) {
            for (File child : children) deleteRecursively(child);
        }
        //noinspection ResultOfMethodCallIgnored
        file.delete();
    }
}
