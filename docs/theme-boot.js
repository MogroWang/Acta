// Boot-time theme priming, executed synchronously from <head> before the
// first paint: reads the saved interface settings and applies the theme
// attributes (and custom palette variables) right away, so the boot splash
// and the page open directly in the saved theme instead of flashing the
// default palette and switching mid-load. Mirrors the theme part of
// applyTheme() in interface.js, which re-applies it once the app is up.
(() => {
  let theme = '', stored = {};
  try {
    stored = JSON.parse(localStorage.getItem('acta.interface.settings.v1')) || {};
    theme = String(stored.theme || '');
  } catch { /* Fall back to the default palette. */ }
  if (!theme) return;
  const darkThemes = new Set(['mono-dark', 'neon-ocean', 'aurora-night']);
  const glowThemes = new Set(['neon-ocean', 'aurora-night']);
  const root = document.documentElement;
  const isDark = darkThemes.has(theme);
  root.dataset.actaTheme = isDark ? 'mono-dark' : theme;
  root.dataset.actaPalette = theme;
  if (glowThemes.has(theme)) root.dataset.actaGlow = 'true';
  else delete root.dataset.actaGlow;
  if (theme === 'custom') {
    const pick = (value, fallback) => (typeof value === 'string' && value.trim()) ? value : fallback;
    const paper = pick(stored.customPaper, '#fbfaf6');
    root.style.setProperty('--paper', paper);
    root.style.setProperty('--panel', paper);
    root.style.setProperty('--sidebar', pick(stored.customSidebar, '#ebe7dc'));
    root.style.setProperty('--sage', pick(stored.customAccent, '#526b55'));
    root.style.setProperty('--sage-2', `${pick(stored.customAccent, '#526b55')}22`);
    root.style.setProperty('--todo-accent', pick(stored.customTodo, '#4f86a8'));
    root.style.setProperty('--todo-soft', pick(stored.customTodoSoft, '#dceef8'));
    root.style.setProperty('--todo-wash', `color-mix(in srgb, ${pick(stored.customTodoSoft, '#dceef8')} 42%, ${paper})`);
    root.style.setProperty('--note-accent', pick(stored.customNote, '#987329'));
    root.style.setProperty('--note-soft', pick(stored.customNoteSoft, '#fff0bd'));
    root.style.setProperty('--note-wash', `color-mix(in srgb, ${pick(stored.customNoteSoft, '#fff0bd')} 42%, ${paper})`);
    root.style.setProperty('--calendar-theme-accent', pick(stored.customCalendar, '#4f7656'));
    root.style.setProperty('--calendar-theme-soft', pick(stored.customCalendarSoft, '#dcebdd'));
  }
  // Prime the list pane width too, so the splash divider lines land exactly on
  // the workspace's column boundaries before interface.js gets a chance to run.
  const listWidth = Math.max(330, Math.min(620, Number(stored.listPaneWidth) || 330));
  root.style.setProperty('--list-pane-width', `${listWidth}px`);
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (colorSchemeMeta) colorSchemeMeta.content = isDark ? 'dark' : 'light';
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) themeColorMeta.content = getComputedStyle(root).getPropertyValue('--sidebar').trim() || '#e6e6e6';
})();
