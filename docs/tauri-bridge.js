(() => {
  'use strict';

  const tauri = window.__TAURI__;
  if (!tauri?.core?.invoke) return;

  const { invoke } = tauri.core;
  const dialog = tauri.dialog;
  const opener = tauri.opener;
  const currentWindow = tauri.window?.getCurrentWindow?.();
  const platform = /Macintosh|Mac OS X/i.test(navigator.userAgent) ? 'darwin' : 'win32';
  document.documentElement.dataset.desktopPlatform = platform;

  const firstPath = value => Array.isArray(value) ? value[0] || null : value || null;
  const baseName = value => String(value || '').split(/[\\/]/).pop() || '';
  const safeMarkdownName = value => {
    const name = baseName(value).replace(/\.(md|markdown|txt)$/i, '') || '行记笔记';
    return `${name}.md`;
  };
  const assetType = Object.freeze({
    'application/pdf': { extension:'pdf', name:'PDF 文档' },
    'image/png': { extension:'png', name:'PNG 图片' },
    'image/jpeg': { extension:'jpg', name:'JPEG 图片' }
  });

  window.actaDesktop = Object.freeze({
    platform,
    async chooseSyncFolder() {
      return firstPath(await dialog.open({
        title:'选择行记数据保存文件夹',
        directory:true,
        multiple:false
      }));
    },
    uploadLibrary(folder, library) {
      return invoke('upload_library', { folder, library });
    },
    downloadLibrary(folder) {
      return invoke('download_library', { folder });
    },
    webDavRequest(requestUrl, requestOptions = {}) {
      return invoke('web_dav_request', { requestUrl, requestOptions });
    },
    async importNote() {
      const path = firstPath(await dialog.open({
        title:'导入单独笔记',
        multiple:false,
        directory:false,
        filters:[{ name:'Markdown / Text', extensions:['md', 'markdown', 'txt'] }]
      }));
      return path ? invoke('import_note', { path }) : null;
    },
    async exportNote(fileName, content) {
      const path = await dialog.save({
        title:'导出单独笔记',
        defaultPath:safeMarkdownName(fileName),
        filters:[{ name:'Markdown', extensions:['md'] }]
      });
      return path ? invoke('export_note', { path, content }) : null;
    },
    async exportAssets(assets) {
      if (!Array.isArray(assets) || !assets.length) return null;
      if (assets.length === 1) {
        const asset = assets[0];
        const type = assetType[asset.mimeType];
        const path = await dialog.save({
          title:'导出笔记',
          defaultPath:baseName(asset.fileName) || `行记笔记.${type?.extension || 'png'}`,
          filters:type ? [{ name:type.name, extensions:[type.extension] }] : []
        });
        return path ? invoke('export_assets', { destination:path, assets, directory:false }) : null;
      }
      const destination = firstPath(await dialog.open({
        title:'选择导出图片保存位置',
        directory:true,
        multiple:false
      }));
      return destination ? invoke('export_assets', { destination, assets, directory:true }) : null;
    },
    clearAppCache() {
      return invoke('clear_app_cache');
    },
    setAppIcon(dataUrl = '') {
      return invoke('set_app_icon', { dataUrl });
    }
  });

  const titlebar = document.querySelector('.titlebar');
  if (titlebar && currentWindow) {
    titlebar.addEventListener('mousedown', event => {
      if (
        event.button !== 0 ||
        event.target.closest('button, a, input, select, textarea, [contenteditable], [role="button"]')
      ) return;
      if (event.detail === 2) currentWindow.toggleMaximize().catch(() => {});
      else currentWindow.startDragging().catch(() => {});
    });
    document.querySelector('[data-window-action="minimize"]')?.addEventListener('click', () => {
      currentWindow.minimize().catch(() => {});
    });
    document.querySelector('[data-window-action="maximize"]')?.addEventListener('click', () => {
      currentWindow.toggleMaximize().catch(() => {});
    });
    document.querySelector('[data-window-action="close"]')?.addEventListener('click', () => {
      currentWindow.close().catch(() => {});
    });
  }

  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || !opener?.openUrl || !/^(https?|mailto):/i.test(anchor.href)) return;
    event.preventDefault();
    opener.openUrl(anchor.href).catch(() => {});
  });
})();
