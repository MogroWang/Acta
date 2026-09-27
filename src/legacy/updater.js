// 应用内自更新流程：静默检查 GitHub Release → 询问用户 → 下载（进度条）→
// 提示重启 → 写任务单并拉起更新向导（Rust 侧完成换包/安装与 macOS 修复）。
// 仅 Tauri 桌面端生效（以 window.actaDesktop 暴露的命令为门槛）；
// 网页端与 Android 走「关于」页既有的链接式检查（interface.js）。
(() => {
  'use strict';

  const bridge = window.actaDesktop;
  if (!bridge?.checkAppUpdate || window.__ACTA_UPDATER__) return;

  // 与 renderer.js / interface.js 一致的语言全局（interface.js 会同步 settings.language）。
  const language = () => (window.settings?.language === 'en' ? 'en' : window.settings?.language === 'zh-Hant' ? 'zh-Hant' : 'zh');
  const copy = {
    zh: {
      title: '发现新版本',
      ask: '是否下载并安装 v{version}？安装会在应用关闭后由更新向导自动完成。',
      downloading: '正在下载更新包…',
      restart: '下载完成。关闭软件后将自动弹出更新向导，现在重启以完成更新吗？',
      restarting: '正在准备重启更新…',
      failed: '更新失败：{detail}',
      notesEmpty: '（暂无更新说明）',
      later: '稍后',
      update: '下载更新',
      restartNow: '立即重启更新',
      close: '关闭',
      size: '{received} / {total} MB（{percent}%）'
    },
    en: {
      title: 'Update available',
      ask: 'Download and install v{version} now? An update wizard finishes the install after the app quits.',
      downloading: 'Downloading the update…',
      restart: 'Download complete. The update wizard opens after the app quits — restart now to update?',
      restarting: 'Preparing to restart…',
      failed: 'Update failed: {detail}',
      notesEmpty: '(no release notes)',
      later: 'Later',
      update: 'Download update',
      restartNow: 'Restart to update',
      close: 'Close',
      size: '{received} / {total} MB ({percent}%)'
    },
    'zh-Hant': {
      title: '發現新版本',
      ask: '是否下載並安裝 v{version}？安裝會在應用關閉後由更新精靈自動完成。',
      downloading: '正在下載更新包…',
      restart: '下載完成。關閉軟體後將自動彈出更新精靈，現在重啟以完成更新嗎？',
      restarting: '正在準備重啟…',
      failed: '更新失敗：{detail}',
      notesEmpty: '（暫無更新說明）',
      later: '稍後',
      update: '下載更新',
      restartNow: '立即重啟更新',
      close: '關閉',
      size: '{received} / {total} MB（{percent}%）'
    }
  };
  const text = (key, vars = {}) => {
    let message = (copy[language()] || copy.zh)[key] || key;
    for (const [name, value] of Object.entries(vars)) message = message.replace(`{${name}}`, value);
    return message;
  };

  let dialog = null;
  let state = 'idle';
  let unsubscribeProgress = null;

  const formatSize = bytes => (bytes / (1024 * 1024)).toFixed(1);

  const ensureDialog = () => {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'acta-updater-dialog';
    dialog.innerHTML = `
      <style>
        .acta-updater-dialog { border: 0; padding: 0; border-radius: 16px; background: #f6f2e9; color: #3a3126;
          box-shadow: 0 18px 60px rgba(40, 32, 20, .28); width: min(400px, calc(100vw - 48px)); }
        .acta-updater-dialog::backdrop { background: rgba(30, 24, 15, .42); }
        .acta-updater-card { padding: 22px 24px 20px; }
        .acta-updater-card h3 { margin: 0 0 8px; font-size: 17px; }
        .acta-updater-card .acta-updater-version { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #8a7d68; }
        .acta-updater-card .acta-updater-notes { margin: 0 0 14px; font-size: 12.5px; line-height: 1.6; color: #6f6350;
          max-height: 96px; overflow: auto; white-space: pre-line; }
        .acta-updater-card .acta-updater-track { height: 6px; border-radius: 3px; background: #ded6c3; overflow: hidden; margin-bottom: 8px; }
        .acta-updater-card .acta-updater-bar { height: 100%; width: 0; border-radius: 3px; background: #6f6350; transition: width .25s ease; }
        .acta-updater-card .acta-updater-percent { margin: 0 0 16px; font-size: 12px; color: #8a7d68; min-height: 16px; }
        .acta-updater-card .acta-updater-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .acta-updater-card button { border: 0; border-radius: 9px; padding: 8px 18px; font-size: 13px; cursor: pointer;
          background: #4a4036; color: #f6f2e9; }
        .acta-updater-card button:hover { background: #3a3126; }
        .acta-updater-card button.secondary { background: transparent; color: #6f6350; }
        .acta-updater-card button.secondary:hover { background: rgba(74, 64, 54, .08); }
        .acta-updater-card button:disabled { opacity: .45; cursor: default; }
        .acta-updater-card.is-error button.secondary { display: none; }
      </style>
      <div class="acta-updater-card">
        <h3 class="acta-updater-title"></h3>
        <p class="acta-updater-version"></p>
        <p class="acta-updater-notes"></p>
        <div class="acta-updater-track" hidden><div class="acta-updater-bar"></div></div>
        <p class="acta-updater-percent"></p>
        <div class="acta-updater-actions">
          <button type="button" class="secondary"></button>
          <button type="button" class="primary"></button>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    return dialog;
  };

  const render = (mode, info, extra = {}) => {
    state = mode;
    const card = ensureDialog();
    const title = card.querySelector('.acta-updater-title');
    const version = card.querySelector('.acta-updater-version');
    const notes = card.querySelector('.acta-updater-notes');
    const track = card.querySelector('.acta-updater-track');
    const bar = card.querySelector('.acta-updater-bar');
    const percent = card.querySelector('.acta-updater-percent');
    const secondary = card.querySelector('button.secondary');
    const primary = card.querySelector('button.primary');

    title.textContent = mode === 'error' ? text('failed', { detail: extra.detail || '' }) : text('title');
    version.textContent = info ? `v${info.version}` : '';
    notes.textContent = info ? (info.notes || text('notesEmpty')) : '';
    notes.hidden = !info;

    track.hidden = mode !== 'download';
    percent.textContent = extra.percentText || '';
    if (mode === 'download') bar.style.width = `${extra.percent || 0}%`;

    secondary.textContent = text(mode === 'ask' || mode === 'ready' ? 'later' : 'close');
    secondary.hidden = mode === 'download';
    primary.textContent = mode === 'ask' ? text('update') : mode === 'ready' ? text('restartNow') : text('close');
    primary.hidden = mode === 'download';
    primary.disabled = mode === 'restarting';
    card.classList.toggle('is-error', mode === 'error');
  };

  const closeDialog = () => { dialog?.close(); };

  const startDownload = info => {
    render('download', info, { percent: 0 });
    if (!unsubscribeProgress) {
      unsubscribeProgress = bridge.onDownloadProgress(event => {
        const payload = event?.payload || {};
        const percent = Number(payload.percent) || 0;
        render('download', info, {
          percent,
          percentText: text('size', { received: formatSize(Number(payload.received) || 0), total: formatSize(Number(payload.total) || 0), percent })
        });
      });
    }
    bridge.downloadAppUpdate({ url: info.url, assetName: info.asset_name, expectedSize: Number(info.size) || 0 })
      .then(payloadPath => {
        render('ready', info);
        dialog.dataset.payloadPath = payloadPath;
      })
      .catch(error => render('error', info, { detail: error?.message || String(error) }));
  };

  const restartToUpdate = info => {
    const payloadPath = dialog?.dataset.payloadPath || '';
    render('restarting', info);
    bridge.prepareUpdateRestart(payloadPath, info.version)
      .then(() => {
        // 与标题栏关闭按钮同一条路径：触发 CloseRequested 落盘后退出，
        // 更新向导等待本进程退出后开始安装。
        return bridge.closeAppWindow();
      })
      .catch(error => render('error', info, { detail: error?.message || String(error) }));
  };

  const open = (info, options = {}) => {
    if (!info?.version || !info?.url) return;
    render('ask', info);
    const primary = dialog.querySelector('button.primary');
    const secondary = dialog.querySelector('button.secondary');
    primary.onclick = () => {
      if (state === 'ask') startDownload(info);
      else if (state === 'ready') restartToUpdate(info);
      else if (state === 'error') { dialog.close(); if (!options.fromAbout) render('idle', null); }
    };
    secondary.onclick = () => { dialog.close(); };
    if (!dialog.open) dialog.showModal();
  };

  // 下载/重启中禁止 Esc 误关（稍后可在关于页重新发起，文件会复用）；
  // 其余状态关闭即复位，避免阻塞之后的自动检查。
  document.addEventListener('cancel', event => {
    if (event.target === dialog && (state === 'download' || state === 'restarting')) event.preventDefault();
  }, true);
  dialog?.addEventListener('close', () => {
    if (state !== 'download' && state !== 'restarting') state = 'idle';
  });
  window.actaUpdater = Object.freeze({ open });

  // 启动后静默检查一次；离线或接口失败都安静跳过，不打扰使用。
  window.setTimeout(async () => {
    if (state !== 'idle') return;
    try {
      const info = await bridge.checkAppUpdate();
      if (info && state === 'idle') open(info);
    } catch { /* 离线等情况忽略 */ }
  }, 6000);
})();

export {};
