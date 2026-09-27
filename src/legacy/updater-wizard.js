// 更新向导界面：主应用以 --acta-update-wizard 拉起自身第二个实例时，
// initialization_script 注入 window.__ACTA_UPDATER__，main.ts 走到本模块
// 而不是挂载完整应用。向导窗口由 Rust 侧（updater::run_wizard）创建，
// 安装步骤也全部在 Rust 线程里执行，这里只负责渲染阶段事件与兜底展示。
(() => {
  'use strict';

  const tauri = window.__TAURI__;
  if (!tauri?.core?.invoke) return;

  const english = !/^zh/i.test(navigator.language || '');
  const copy = english ? {
    title: 'Acta Update',
    waiting: 'Waiting for the app to exit…',
    installing: 'Installing the new version…',
    repairing: 'Clearing the quarantine flag…',
    launching: 'Launching the new version…',
    done: 'Update complete',
    error: 'Update failed',
    close: 'Close',
    hintRepair: 'If a Terminal window appears, enter your password to finish the repair.'
  } : {
    title: 'Acta 更新',
    waiting: '等待应用退出…',
    installing: '正在安装新版本…',
    repairing: '正在清除隔离标记…',
    launching: '正在启动新版本…',
    done: '更新完成',
    error: '更新失败',
    close: '关闭',
    hintRepair: '如果弹出了终端窗口，请输入密码以完成修复。'
  };
  const stageCopy = { wait: copy.waiting, install: copy.installing, repair: copy.repairing, launch: copy.launching, done: copy.done, error: copy.error };

  const appRoot = document.getElementById('app');
  if (appRoot) {
    appRoot.innerHTML = `
      <style>
        html, body { height: 100%; margin: 0; }
        body { display: flex; align-items: center; justify-content: center; background: #ebe7dc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
        .acta-wizard { width: 100%; max-width: 360px; padding: 0 24px; color: #3a3126; user-select: none; }
        .acta-wizard h1 { margin: 0 0 18px; font-size: 19px; font-weight: 700; letter-spacing: .02em; }
        .acta-wizard .track { height: 6px; border-radius: 3px; background: #d9d2c0; overflow: hidden; position: relative; }
        .acta-wizard .bar { height: 100%; width: 0; border-radius: 3px; background: #6f6350; transition: width .35s ease, background-color .3s ease; }
        .acta-wizard.is-busy .bar { width: 34%; animation: acta-wizard-slide 1.2s ease-in-out infinite; }
        @keyframes acta-wizard-slide { 0% { margin-left: -34%; } 100% { margin-left: 100%; } }
        .acta-wizard.is-done .bar { width: 100%; background: #5d7a52; animation: none; }
        .acta-wizard.is-error .bar { width: 100%; background: #a4543f; animation: none; }
        .acta-wizard .stage { margin: 14px 0 4px; font-size: 13.5px; min-height: 18px; }
        .acta-wizard .hint { margin: 0; font-size: 12px; color: #8a7d68; min-height: 16px; }
        .acta-wizard .actions { margin-top: 18px; text-align: right; }
        .acta-wizard button { display: none; border: 0; border-radius: 9px; padding: 7px 16px; font-size: 13px; background: #4a4036; color: #f6f2e9; cursor: pointer; }
        .acta-wizard button:hover { background: #3a3126; }
        .acta-wizard.is-error button { display: inline-block; }
      </style>
      <div class="acta-wizard is-busy" id="actaWizard">
        <h1>${copy.title}</h1>
        <div class="track"><div class="bar"></div></div>
        <p class="stage">${copy.waiting}</p>
        <p class="hint"></p>
        <div class="actions"><button type="button" id="actaWizardClose">${copy.close}</button></div>
      </div>`;
  }
  const root = document.getElementById('actaWizard');
  const stageEl = root?.querySelector('.stage');
  const hintEl = root?.querySelector('.hint');

  const apply = payload => {
    if (!root || !payload) return;
    const stage = String(payload.stage || '');
    const message = String(payload.message || '');
    root.classList.remove('is-busy', 'is-done', 'is-error');
    if (stage === 'done') root.classList.add('is-done');
    else if (stage === 'error') root.classList.add('is-error');
    else root.classList.add('is-busy');
    if (stageEl) stageEl.textContent = stageCopy[stage] || message || copy.installing;
    if (hintEl) hintEl.textContent = stage === 'repair' ? copy.hintRepair : (stage === 'done' || stage === 'error' ? message : '');
  };

  document.getElementById('actaWizardClose')?.addEventListener('click', () => {
    tauri.window?.getCurrentWindow?.().close?.();
  });

  // 先取当前阶段快照（补齐页面加载前错过的事件），再挂监听接续更新。
  invoke('wizard_stage')
    .then(raw => {
      const [stage, ...rest] = String(raw || '').split('|');
      if (stage) apply({ stage, message: rest.join('|') });
    })
    .catch(() => {});
  tauri.event.listen('update://wizard', event => apply(event.payload));
})();

export {};
