// 自定义下拉组件：接管所有原生 <select> 的下拉弹层。
// select 本体仍然是可见的触发器（保留原生文字渲染、表单逻辑与布局），
// 仅替换弹出的选项列表：弹层锚定在触发器上（transform-origin 跟随上下翻转），
// 展开/收起沿同一路径做缩放+淡入，随时可被再次点击打断。
// 弹层定位用 fixed；触发器位于 <dialog>（顶层渲染）内时，弹层挂进该 dialog，
// 并相对 dialog 的边框盒计算坐标（dialog 的动画 transform 会成为包含块）。
(() => {
  'use strict';
  if (window.__actaCustomSelect) return;

  const ENHANCED_FLAG = 'data-acx-enhanced';
  let menu = null;
  let openState = null; // { select, dialog }
  let closeTimer = 0;

  const CHEVRON = 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23989b94\' stroke-width=\'2.2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")';
  const style = document.createElement('style');
  style.textContent = `
select[${ENHANCED_FLAG}] { appearance: none; -webkit-appearance: none; background-image: ${CHEVRON}; background-repeat: no-repeat; background-position: right 8px center; background-size: 10px; }
select[${ENHANCED_FLAG}]:hover { border-color: color-mix(in srgb, var(--sage) 30%, var(--line)); }
.acx-menu { position: fixed; z-index: 2147483000; min-width: 128px; max-height: 264px; margin: 0; padding: 5px; border: 1px solid color-mix(in srgb, var(--line) 78%, var(--faint)); border-radius: 12px; background: var(--paper); color: var(--ink); box-shadow: 0 3px 9px -2px rgba(31,35,30,.14), 0 14px 32px -10px rgba(31,35,30,.22); overflow: hidden auto; overscroll-behavior: contain; opacity: 0; transform: scale(.955) translateY(-5px); transform-origin: 50% 0; pointer-events: none; transition: opacity .16s ease, transform .26s cubic-bezier(.16,1,.3,1); }
.acx-menu.acx-flip { transform-origin: 50% 100%; transform: scale(.955) translateY(5px); }
.acx-menu.acx-open { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
.acx-menu.acx-closing { transition: opacity .13s ease, transform .13s cubic-bezier(.4,0,.7,.2); }
.acx-option { width: 100%; min-height: 32px; padding: 6px 9px; border: 0; border-radius: 8px; background: transparent; color: inherit; display: flex; align-items: center; justify-content: space-between; gap: 9px; text-align: left; font: inherit; font-size: calc(11px * var(--acta-font-scale, 1)); line-height: 1.4; cursor: pointer; transition: background .14s ease, color .14s ease; }
.acx-option:hover, .acx-option.acx-active { background: var(--panel); color: var(--ink); }
.acx-option[aria-selected="true"] { color: var(--sage); font-weight: 650; }
.acx-option svg { width: 13px; height: 13px; flex: 0 0 auto; color: var(--sage); opacity: 0; }
.acx-option[aria-selected="true"] svg { opacity: 1; }
.acx-option[disabled] { color: var(--faint); cursor: default; }
.acx-empty { padding: 12px 10px; color: var(--faint); font-size: calc(10px * var(--acta-font-scale, 1)); text-align: center; }
@media (prefers-reduced-motion: reduce) { .acx-menu { transition: opacity .01ms; transform: none; } }
`;
  document.head.appendChild(style);

  const ensureMenu = () => {
    if (menu) return menu;
    menu = document.createElement('div');
    menu.className = 'acx-menu';
    menu.setAttribute('role', 'listbox');
    menu.addEventListener('mousedown', event => event.preventDefault());
    menu.addEventListener('click', event => {
      const option = event.target.closest('.acx-option');
      if (!option || option.disabled || !openState) return;
      commitValue(openState.select, option.dataset.value);
    });
    return menu;
  };

  const commitValue = (select, value) => {
    if (String(select.value) !== String(value)) {
      select.value = value;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    closeMenu();
    select.focus({ preventScroll: true });
  };

  const closeMenu = (immediate = false) => {
    if (!openState || !menu) return;
    openState = null;
    clearTimeout(closeTimer);
    const closing = menu;
    if (immediate) { closing.remove(); return; }
    closing.classList.add('acx-closing');
    closing.classList.remove('acx-open');
    closeTimer = setTimeout(() => closing.remove(), 140);
  };

  const placeMenu = () => {
    if (!openState || !menu) return;
    const { select, dialog } = openState;
    const rect = select.getBoundingClientRect();
    if (!menu.isConnected) return;
    const dialogRect = dialog ? dialog.getBoundingClientRect() : null;
    const width = Math.max(rect.width, 128);
    const popupHeight = Math.min(menu.scrollHeight + 12, 264);
    const spaceBelow = (dialogRect ? dialogRect.bottom : window.innerHeight) - rect.bottom;
    const spaceAbove = rect.top - (dialogRect ? dialogRect.top : 0);
    const flip = spaceBelow < Math.min(popupHeight + 8, 180) && spaceAbove > spaceBelow;
    let left = rect.left - (dialogRect ? dialogRect.left : 0);
    let top = flip
      ? rect.top - (dialogRect ? dialogRect.top : 0) - Math.min(popupHeight, spaceAbove) - 6
      : rect.bottom - (dialogRect ? dialogRect.top : 0) + 6;
    const viewportWidth = dialogRect ? dialogRect.width : window.innerWidth;
    if (dialogRect) {
      left = Math.min(Math.max(left, 6), dialogRect.width - width - 6);
    } else {
      left = Math.min(Math.max(left, 8), Math.max(8, window.innerWidth - width - 8));
    }
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    menu.classList.toggle('acx-flip', flip);
    void viewportWidth;
  };

  const renderOptions = select => {
    const menuEl = ensureMenu();
    menuEl.innerHTML = '';
    const options = [...select.options];
    if (!options.length) {
      menuEl.innerHTML = '<div class="acx-empty">…</div>';
      return;
    }
    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'acx-option';
      button.dataset.value = option.value;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', option.selected ? 'true' : 'false');
      if (option.disabled) button.disabled = true;
      const label = document.createElement('span');
      label.textContent = option.textContent;
      const check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      check.innerHTML = '<use href="#i-check"/>';
      button.append(label, check);
      menuEl.appendChild(button);
    });
  };

  const syncSelection = () => {
    if (!openState || !menu) return;
    [...menu.querySelectorAll('.acx-option')].forEach(option => {
      option.setAttribute('aria-selected', String(option.dataset.value) === String(openState.select.value) ? 'true' : 'false');
    });
  };

  const moveHighlight = step => {
    if (!menu) return;
    const options = [...menu.querySelectorAll('.acx-option:not([disabled])')];
    if (!options.length) return;
    const current = menu.querySelector('.acx-option.acx-active') || menu.querySelector('.acx-option[aria-selected="true"]');
    let index = options.indexOf(current) + step;
    if (current && step === 0) index = options.indexOf(current);
    index = Math.max(0, Math.min(options.length - 1, index));
    options.forEach(option => option.classList.remove('acx-active'));
    const target = options[index] || options[0];
    target.classList.add('acx-active');
    target.scrollIntoView({ block: 'nearest' });
  };

  const openMenu = select => {
    if (select.disabled || select.multiple) return;
    const rect = select.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    clearTimeout(closeTimer);
    closeMenu(true);
    const dialog = select.closest('dialog');
    const menuEl = ensureMenu();
    renderOptions(select);
    (dialog || document.body).appendChild(menuEl);
    openState = { select, dialog };
    placeMenu();
    // 双 rAF：先让弹层以收起态完成布局，再过渡到展开态（可中断、沿同一路径返回）。
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (openState) {
        menuEl.classList.add('acx-open');
        const selected = menuEl.querySelector('.acx-option[aria-selected="true"]') || menuEl.querySelector('.acx-option');
        selected?.scrollIntoView({ block: 'nearest' });
      }
    }));
  };

  const handleDocumentPointerDown = event => {
    if (!openState) return;
    if (event.target.closest('.acx-menu')) return;
    if (event.target.closest(`[${ENHANCED_FLAG}]`) === openState.select) return;
    closeMenu();
  };

  const handleDocumentKeyDown = event => {
    if (!openState || !menu) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
      openState?.select.focus({ preventScroll: true });
      return;
    }
    if (event.key === 'ArrowDown') { event.preventDefault(); moveHighlight(1); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveHighlight(-1); return; }
    if (event.key === 'Home') { event.preventDefault(); moveHighlightTo(0); return; }
    if (event.key === 'End') { event.preventDefault(); moveHighlightTo(-1); return; }
    if (event.key === 'Enter') {
      const active = menu.querySelector('.acx-option.acx-active') || menu.querySelector('.acx-option[aria-selected="true"]');
      if (active) {
        event.preventDefault();
        commitValue(openState.select, active.dataset.value);
      }
    }
  };

  const moveHighlightTo = index => {
    if (!menu) return;
    const options = [...menu.querySelectorAll('.acx-option:not([disabled])')];
    if (!options.length) return;
    const target = index < 0 ? options[options.length - 1] : options[0];
    options.forEach(option => option.classList.remove('acx-active'));
    target.classList.add('acx-active');
    target.scrollIntoView({ block: 'nearest' });
  };

  const handleScroll = event => {
    if (!openState) return;
    if (event.target.contains && event.target.contains(openState.select)) placeMenu();
    else if (event.target === document || event.target === document.documentElement) placeMenu();
  };

  document.addEventListener('pointerdown', handleDocumentPointerDown, true);
  document.addEventListener('keydown', handleDocumentKeyDown, true);
  window.addEventListener('resize', () => placeMenu(), true);
  window.addEventListener('scroll', handleScroll, true);

  const enhance = select => {
    if (!(select instanceof HTMLSelectElement)) return;
    if (select.hasAttribute(ENHANCED_FLAG) || select.multiple) return;
    select.setAttribute(ENHANCED_FLAG, 'true');
    const trigger = event => {
      if (event.button !== undefined && event.button !== 0) return;
      if (select.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      if (openState?.select === select) { closeMenu(); return; }
      select.focus({ preventScroll: true });
      openMenu(select);
    };
    select.addEventListener('mousedown', trigger);
    const label = select.closest('label');
    if (label) label.addEventListener('mousedown', trigger);
    select.addEventListener('keydown', event => {
      if (select.disabled || openState?.select === select) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === ' ') {
        trigger(event);
      }
    });
    select.addEventListener('change', syncSelection);
  };

  const enhanceAll = root => {
    (root || document).querySelectorAll?.('select').forEach(enhance);
  };
  enhanceAll(document);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node instanceof HTMLSelectElement) enhance(node);
        else if (node.querySelectorAll) node.querySelectorAll('select').forEach(enhance);
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.__actaCustomSelect = { enhance, enhanceAll, closeMenu };
})();
