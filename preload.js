const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('actaDesktop', {
  platform: process.platform,
  chooseSyncFolder: () => ipcRenderer.invoke('sync:choose-folder'),
  uploadLibrary: (folder, library) => ipcRenderer.invoke('sync:upload', folder, library),
  downloadLibrary: (folder) => ipcRenderer.invoke('sync:download', folder),
  webDavRequest: (url, options) => ipcRenderer.invoke('webdav:request', url, options),
  importNote: () => ipcRenderer.invoke('note:import'),
  exportNote: (fileName, content) => ipcRenderer.invoke('note:export', fileName, content)
});
