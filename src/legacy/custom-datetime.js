// 自定义日期时间选择器：接管所有原生 <input type="datetime-local"> 的弹出选择。
// input 本体保留为值载体与触发器（设为 readonly，杜绝原生日历/滚轮），
// 弹层提供月历 + 时/分/秒选择；写回格式与 renderer 的 dateTimeLocalValue
// （YYYY-MM-DDTHH:mm:ss）一致，现有读写 input.value 的逻辑零改动。
// 弹层定位沿用 custom-select 的方案：fixed 定位、锚定触发器、
// 触发器位于 <dialog> 内时挂进该 dialog 并相对其边框盒计算坐标。
(() => {
  'use strict';
  if (window.__actaCustomDatetime) return;

  const ENHANCED_FLAG = 'data-acdt-enhanced';
  let panel = null;
  let openState = null; // { input, dialog, view: {year, month}, value: {year, month, day, hour, minute, second} }
  let closeTimer = 0;

  const style = document.createElement('style');
  style.textContent = `
input[${ENHANCED_FLAG}] { cursor: pointer; }
input[${ENHANCED_FLAG}]:hover { border-color: color-mix(in srgb, var(--sage) 30%, var(--line)); }
.acdt-panel { position: fixed; z-index: 2147483000; width: 268px; margin: 0; padding: 10px 10px 8px; border: 1px solid color-mix(in srgb, var(--line) 78%, var(--faint)); border-radius: 14px; background: var(--paper); color: var(--ink); box-shadow: 0 3px 9px -2px rgba(31,35,30,.14), 0 14px 32px -10px rgba(31,35,30,.22); opacity: 0; transform: scale(.955) translateY(-5px); transform-origin: 50% 0; pointer-events: none; transition: opacity .16s ease, transform .26s cubic-bezier(.16,1,.3,1); font-size: calc(11px * var(--acta-font-scale, 1)); }
.acdt-panel.acdt-flip { transform-origin: 50% 100%; transform: scale(.955) translateY(5px); }
.acdt-panel.acdt-open { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
.acdt-panel.acdt-closing { transition: opacity .13s ease, transform .13s cubic-bezier(.4,0,.7,.2); }
.acdt-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 7px; }
.acdt-title { min-width: 0; text-align: center; font-weight: 700; font-size: calc(11px * var(--acta-font-scale, 1)); letter-spacing: .01em; }
.acdt-nav { width: 26px; height: 26px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: var(--muted); display: grid; place-items: center; cursor: pointer; transition: background .14s ease, color .14s ease, transform .18s cubic-bezier(.16,1,.3,1); }
.acdt-nav:hover { background: var(--panel); color: var(--ink); transform: scale(1.06); }
.acdt-nav svg { width: 13px; height: 13px; }
.acdt-nav.acdt-next svg { transform: rotate(180deg); }
.acdt-week, .acdt-grid { display: grid; grid-template-columns: repeat(7, minmax(0,1fr)); gap: 2px; }
.acdt-week span { padding: 2px 0 4px; color: var(--faint); font-size: calc(9px * var(--acta-font-scale, 1)); text-align: center; }
.acdt-day { height: 30px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: var(--ink); font: inherit; font-size: calc(10px * var(--acta-font-scale, 1)); cursor: pointer; transition: background .13s ease, color .13s ease; }
.acdt-day:hover { background: var(--panel); }
.acdt-day.acdt-out { color: var(--faint); opacity: .55; }
.acdt-day.acdt-today { color: var(--sage); font-weight: 700; }
.acdt-day.acdt-selected { background: var(--sage); color: #fff; font-weight: 650; }
.acdt-time { display: flex; align-items: end; gap: 7px; margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--line); }
.acdt-time label { min-width: 0; flex: 1; display: grid; gap: 3px; }
.acdt-time label span { color: var(--faint); font-size: calc(8px * var(--acta-font-scale, 1)); }
.acdt-time select { width: 100%; height: 29px; padding: 0 20px 0 7px; border: 1px solid var(--line); border-radius: 8px; background: var(--white); color: var(--ink); outline: 0; font: inherit; font-size: calc(10px * var(--acta-font-scale, 1)); }
.acdt-actions { display: flex; align-items: center; justify-content: space-between; gap: 7px; margin-top: 9px; }
.acdt-actions button { height: 28px; padding: 0 11px; border: 1px solid var(--line); border-radius: 8px; background: transparent; color: var(--muted); font: inherit; font-size: calc(9px * var(--acta-font-scale, 1)); font-weight: 650; cursor: pointer; transition: color .15s ease, background .15s ease, border-color .15s ease; }
.acdt-actions button:hover { color: var(--ink); background: var(--panel); }
.acdt-actions .acdt-now { color: var(--sage); border-color: color-mix(in srgb, var(--sage) 30%, var(--line)); }
.acdt-actions .acdt-now:hover { background: color-mix(in srgb, var(--sage) 12%, transparent); }
@media (prefers-reduced-motion: reduce) { .acdt-panel { transition: opacity .01ms; transform: none; } }
`;
  document.head.appendChild(style);

  const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
  const pad = value => String(value).padStart(2, '0');

  const toLocalValue = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  const toTwo = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const parseInputValue = raw => {
    const match = String(raw || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;
    return {
      year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]),
      hour: Number(match[4]), minute: Number(match[5]), second: Number(match[6] || 0)
    };
  };

  const writeBack = () => {
    if (!openState) return;
    const { input, value } = openState;
    const next = `${value.year}-${pad(value.month + 1)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}:${pad(value.second)}`;
    if (input.value !== next) {
      input.value = next;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const renderPanel = () => {
    if (!openState || !panel) return;
    const { value, view } = openState;
    panel.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'acdt-head';
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'acdt-nav';
    prev.setAttribute('aria-label', '上一月');
    prev.innerHTML = '<svg><use href="#i-chevron"/></svg>';
    const title = document.createElement('b');
    title.className = 'acdt-title';
    title.textContent = `${view.year} 年 ${view.month + 1} 月`;
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'acdt-nav acdt-next';
    next.setAttribute('aria-label', '下一月');
    next.innerHTML = '<svg><use href="#i-chevron"/></svg>';
    head.append(prev, title, next);

    const week = document.createElement('div');
    week.className = 'acdt-week';
    WEEKDAYS.forEach(label => {
      const cell = document.createElement('span');
      cell.textContent = label;
      week.appendChild(cell);
    });

    const grid = document.createElement('div');
    grid.className = 'acdt-grid';
    const firstDay = new Date(view.year, view.month, 1);
    const startOffset = firstDay.getDay();
    const todayTwo = toTwo(new Date());
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(view.year, view.month, 1 - startOffset + index);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'acdt-day';
      cell.textContent = String(date.getDate());
      cell.dataset.date = toTwo(date);
      const outOfMonth = date.getMonth() !== view.month;
      if (outOfMonth) cell.classList.add('acdt-out');
      if (cell.dataset.date === todayTwo) cell.classList.add('acdt-today');
      if (value.year === date.getFullYear() && value.month === date.getMonth() && value.day === date.getDate()) {
        cell.classList.add('acdt-selected');
      }
      grid.appendChild(cell);
    }

    const time = document.createElement('div');
    time.className = 'acdt-time';
    [['hour', '时', 23], ['minute', '分', 59], ['second', '秒', 59]].forEach(([key, label, max]) => {
      const field = document.createElement('label');
      const caption = document.createElement('span');
      caption.textContent = label;
      const select = document.createElement('select');
      select.className = `acdt-${key}`;
      for (let unit = 0; unit <= max; unit += 1) {
        const option = document.createElement('option');
        option.value = String(unit);
        option.textContent = pad(unit);
        select.appendChild(option);
      }
      select.value = String(value[key]);
      select.dataset.unit = key;
      field.append(caption, select);
      time.appendChild(field);
    });

    const actions = document.createElement('div');
    actions.className = 'acdt-actions';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'acdt-clear';
    clear.textContent = '清除';
    const now = document.createElement('button');
    now.type = 'button';
    now.className = 'acdt-now';
    now.textContent = '此刻';
    actions.append(clear, now);

    panel.append(head, week, grid, time, actions);
  };

  const placePanel = () => {
    if (!openState || !panel) return;
    const { input, dialog } = openState;
    const rect = input.getBoundingClientRect();
    if (!panel.isConnected) return;
    const dialogRect = dialog ? dialog.getBoundingClientRect() : null;
    const width = panel.offsetWidth || 268;
    const height = panel.offsetHeight || 330;
    const spaceBelow = (dialogRect ? dialogRect.bottom : window.innerHeight) - rect.bottom;
    const spaceAbove = rect.top - (dialogRect ? dialogRect.top : 0);
    const flip = spaceBelow < height + 10 && spaceAbove > spaceBelow;
    let left = rect.left - (dialogRect ? dialogRect.left : 0);
    const top = flip
      ? rect.top - (dialogRect ? dialogRect.top : 0) - height - 6
      : rect.bottom - (dialogRect ? dialogRect.top : 0) + 6;
    if (dialogRect) left = Math.min(Math.max(left, 6), Math.max(6, dialogRect.width - width - 6));
    else left = Math.min(Math.max(left, 8), Math.max(8, window.innerWidth - width - 8));
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
    panel.classList.toggle('acdt-flip', flip);
  };

  const closePanel = (immediate = false) => {
    if (!openState || !panel) return;
    openState = null;
    clearTimeout(closeTimer);
    const closing = panel;
    if (immediate) { closing.remove(); return; }
    closing.classList.add('acdt-closing');
    closing.classList.remove('acdt-open');
    closeTimer = setTimeout(() => closing.remove(), 140);
  };

  const openPanel = input => {
    if (input.disabled) return;
    const rect = input.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    clearTimeout(closeTimer);
    closePanel(true);
    const dialog = input.closest('dialog');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'acdt-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', '选择日期和时间');
      panel.addEventListener('mousedown', event => event.preventDefault());
      panel.addEventListener('click', event => {
        if (!openState) return;
        const nav = event.target.closest('.acdt-nav');
        if (nav) {
          const step = nav.classList.contains('acdt-next') ? 1 : -1;
          const shifted = openState.view.year * 12 + openState.view.month + step;
          openState.view.year = Math.floor(shifted / 12);
          openState.view.month = ((shifted % 12) + 12) % 12;
          renderPanel();
          placePanel();
          return;
        }
        const day = event.target.closest('.acdt-day');
        if (day) {
          const [year, month, date] = day.dataset.date.split('-').map(Number);
          openState.value = { ...openState.value, year, month: month - 1, day: date };
          writeBack();
          renderPanel();
          placePanel();
          return;
        }
        if (event.target.closest('.acdt-clear')) {
          openState.input.value = '';
          openState.input.dispatchEvent(new Event('input', { bubbles: true }));
          openState.input.dispatchEvent(new Event('change', { bubbles: true }));
          closePanel();
          return;
        }
        if (event.target.closest('.acdt-now')) {
          const current = new Date();
          openState.value = parseInputValue(toLocalValue(current));
          writeBack();
          openState.view = { year: openState.value.year, month: openState.value.month };
          renderPanel();
          placePanel();
        }
      });
      panel.addEventListener('change', event => {
        const select = event.target.closest('select[data-unit]');
        if (!select || !openState) return;
        const unit = select.dataset.unit;
        openState.value[unit] = Number(select.value) || 0;
        writeBack();
      });
    }
    const parsed = parseInputValue(input.value);
    const fallback = new Date();
    openState = {
      input,
      dialog,
      value: parsed || { year: fallback.getFullYear(), month: fallback.getMonth(), day: fallback.getDate(), hour: 0, minute: 0, second: 0 },
      view: null
    };
    openState.view = { year: openState.value.year, month: openState.value.month };
    renderPanel();
    (dialog || document.body).appendChild(panel);
    placePanel();
    // 双 rAF：先以收起态完成布局，再过渡到展开态，可中断、沿同一路径返回。
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (openState) panel.classList.add('acdt-open');
    }));
  };

  const handleDocumentPointerDown = event => {
    if (!openState) return;
    if (event.target.closest('.acdt-panel')) return;
    if (event.target.closest(`[${ENHANCED_FLAG}]`) === openState.input) return;
    closePanel();
  };

  const moveDayFocus = step => {
    const days = [...panel.querySelectorAll('.acdt-day')];
    const current = days.indexOf(document.activeElement);
    const target = days[(current < 0 ? 0 : current) + step];
    target?.focus({ preventScroll: true });
  };

  const handleDocumentKeyDown = event => {
    if (!openState || !panel) return;
    if (event.key === 'Escape') {
      // custom-select 的时间下拉打开时，Esc 交给它先收起。
      if (document.querySelector('.acx-menu.acx-open')) return;
      event.preventDefault();
      event.stopPropagation();
      closePanel();
      openState?.input?.focus({ preventScroll: true });
      return;
    }
    if (!panel.contains(document.activeElement)) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); moveDayFocus(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); moveDayFocus(-1); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); moveDayFocus(7); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveDayFocus(-7); }
  };

  document.addEventListener('pointerdown', handleDocumentPointerDown, true);
  document.addEventListener('keydown', handleDocumentKeyDown, true);
  window.addEventListener('resize', () => placePanel(), true);
  window.addEventListener('scroll', event => {
    if (!openState) return;
    if (event.target.contains && event.target.contains(openState.input)) placePanel();
    else if (event.target === document || event.target === document.documentElement) placePanel();
  }, true);

  const enhance = input => {
    if (!(input instanceof HTMLInputElement) || input.type !== 'datetime-local') return;
    if (input.hasAttribute(ENHANCED_FLAG)) return;
    input.setAttribute(ENHANCED_FLAG, 'true');
    input.readOnly = true;
    const trigger = event => {
      if (event.button !== undefined && event.button !== 0) return;
      if (input.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      if (openState?.input === input) { closePanel(); return; }
      openPanel(input);
    };
    input.addEventListener('mousedown', trigger);
    const label = input.closest('label');
    if (label) label.addEventListener('mousedown', trigger);
    input.addEventListener('keydown', event => {
      if (input.disabled || openState?.input === input) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === ' ' || event.key === 'Enter') trigger(event);
    });
  };

  const enhanceAll = root => {
    (root || document).querySelectorAll?.('input[type="datetime-local"]').forEach(enhance);
  };
  enhanceAll(document);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node instanceof HTMLInputElement) enhance(node);
        else if (node.querySelectorAll) node.querySelectorAll('input[type="datetime-local"]').forEach(enhance);
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.__actaCustomDatetime = { enhance, enhanceAll, closePanel };
})();
