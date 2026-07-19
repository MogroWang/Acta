const { app, BrowserWindow, ipcMain, dialog, shell, net } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const SYNC_FILE = 'acta-library.json';

function createWindow() {
  const isMac = process.platform === 'darwin';
  const captureMobile = process.argv.includes('--capture-mobile');
  const win = new BrowserWindow({
    width: captureMobile ? 412 : 1480,
    height: captureMobile ? 915 : 920,
    minWidth: captureMobile ? 360 : 1100,
    minHeight: captureMobile ? 640 : 700,
    backgroundColor: '#f4f1e9',
    icon: path.join(__dirname, 'resources', 'icon.png'),
    title: 'Acta · 行记',
    titleBarStyle: 'hidden',
    titleBarOverlay: isMac
      ? false
      : { color: '#ebe7dc', symbolColor: '#31352f', height: 52 },
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Lightweight visual smoke-test modes: --capture, --capture-todo, --capture-sync, --capture-mobile
  const captureMode = process.argv.find((argument) => argument.startsWith('--capture'));
  if (captureMode) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        if (captureMode === '--capture-todo') {
          await win.webContents.executeJavaScript("document.querySelector('[data-id=\"launch-plan\"]')?.click()");
        }
        if (captureMode === '--capture-sync') {
          await win.webContents.executeJavaScript("document.querySelector('#syncButton')?.click()");
        }
        await new Promise((resolve) => setTimeout(resolve, 350));
        const image = await win.webContents.capturePage();
        const suffix = captureMode.replace('--capture', '').replace('-', '');
        await fs.writeFile(path.join(__dirname, `acta-preview${suffix ? `-${suffix}` : ''}.png`), image.toPNG());
        app.quit();
      }, 900);
    });
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('sync:choose-folder', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择 Acta 同步文件夹',
    properties: ['openDirectory', 'createDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('sync:upload', async (_event, folder, library) => {
  if (!folder || typeof folder !== 'string') throw new Error('未选择同步文件夹');
  const target = path.join(folder, SYNC_FILE);
  await fs.writeFile(target, JSON.stringify({
    format: 'acta-library',
    version: 1,
    syncedAt: new Date().toISOString(),
    library
  }, null, 2), 'utf8');
  return { path: target, syncedAt: new Date().toISOString() };
});

ipcMain.handle('sync:download', async (_event, folder) => {
  if (!folder || typeof folder !== 'string') throw new Error('未选择同步文件夹');
  const target = path.join(folder, SYNC_FILE);
  const raw = await fs.readFile(target, 'utf8');
  const parsed = JSON.parse(raw);
  if (parsed.format !== 'acta-library' || !parsed.library) {
    throw new Error('这不是有效的 Acta 数据文件');
  }
  return { library: parsed.library, syncedAt: parsed.syncedAt, path: target };
});

ipcMain.handle('webdav:request', async (_event, requestUrl, requestOptions = {}) => {
  const target = new URL(String(requestUrl || ''));
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('WebDAV 仅支持 HTTP 或 HTTPS 地址');
  const method = String(requestOptions.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'PUT', 'DELETE', 'PROPFIND', 'MKCOL'].includes(method)) throw new Error('不支持的 WebDAV 请求方法');
  const allowedHeaders = new Set(['authorization', 'accept', 'content-type', 'depth']);
  const headers = {};
  for (const [name, value] of Object.entries(requestOptions.headers || {})) {
    if (allowedHeaders.has(name.toLowerCase()) && typeof value === 'string') headers[name] = value;
  }
  const body = typeof requestOptions.body === 'string' ? requestOptions.body : undefined;
  if (body && Buffer.byteLength(body, 'utf8') > 16 * 1024 * 1024) throw new Error('单个 WebDAV 文件不能超过 16 MB');
  try {
    const response = await net.fetch(target.toString(), { method, headers, body, redirect: 'follow' });
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: method === 'HEAD' ? '' : await response.text()
    };
  } catch (error) {
    throw new Error(`WebDAV 网络请求失败：${error.message}`);
  }
});

ipcMain.handle('note:import', async () => {
  const result = await dialog.showOpenDialog({
    title: '导入单独笔记',
    properties: ['openFile'],
    filters: [
      { name: 'Markdown / Text', extensions: ['md', 'markdown', 'txt'] },
      { name: 'All files', extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  const stats = await fs.stat(filePath);
  if (!stats.isFile()) throw new Error('请选择一个笔记文件');
  if (stats.size > 5 * 1024 * 1024) throw new Error('文件不能超过 5 MB');
  return { content: await fs.readFile(filePath, 'utf8'), fileName: path.basename(filePath), path: filePath };
});

ipcMain.handle('note:export', async (_event, fileName, content) => {
  if (typeof fileName !== 'string' || typeof content !== 'string') throw new Error('笔记内容无效');
  if (Buffer.byteLength(content, 'utf8') > 5 * 1024 * 1024) throw new Error('文件不能超过 5 MB');
  const safeName = path.basename(fileName).replace(/\.(md|markdown|txt)$/i, '') + '.md';
  const result = await dialog.showSaveDialog({
    title: '导出单独笔记',
    defaultPath: safeName,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  if (result.canceled || !result.filePath) return null;
  await fs.writeFile(result.filePath, content, 'utf8');
  return { fileName: path.basename(result.filePath), path: result.filePath };
});
