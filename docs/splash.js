// Boot splash: shows the Acta wordmark centered while the page loads. The
// splash leaves only once BOTH conditions are met - the page finished loading
// (window load) and the logo's entrance animation has played out - so a fast
// local load can never cut the wordmark off before it was seen. Leaving is
// staged: the logo flies non-linearly to the titlebar logo's exact position
// and size (desktop: top-left, macOS traffic-light layout: as laid out) while
// fading out, divider lines mirroring the workspace's real borders draw
// themselves across the paper in parallel, and finally the layer cross-fades
// with the workspace reveal (acta-app-reveal on <html> starts the shell's
// fade-in at the same moment).
// Presets & speed come from acta.interface.settings.v1
// (splashAnimationEnabled / splashAnimationPreset / splashAnimationSpeed);
// theme-boot.js primes the preset attribute and the --splash-speed multiplier
// onto <html> before the first paint, so this script only reads the enabled
// flag to skip the show entirely. A pristine copy of the layer is kept so the
// settings panel can replay the choreography on demand (actaSplash.replay(),
// marked with .is-replaying so the "off" styling does not hide the preview).
// Desktop (Tauri): the window is created hidden. On macOS it is additionally
// transparent (tauri.macos.conf.json), so revealing it before the webview's
// first frame shows nothing at all instead of the native background - which
// lets a short post-load timer drive the reveal there, immune to the rAF
// throttling hidden webviews apply. Other platforms keep the two-rAF
// handshake with the themed native background. Rust reveals the window
// itself after a 3s grace period if this script never gets the chance to run.
// The splash is purely visual - it never intercepts pointer events, so early
// automation (e.g. smoke tests) is unaffected. Failsafes guarantee it can
// never block the UI: load and animationend each get a timeout fallback here
// (scaled by --splash-speed), and CSS keyframes hide the splash and reveal
// the shell even if this script never ran at all.
(() => {
  const SPLASH_PRESETS = new Set(['acta-lines', 'calm-fade', 'focus-zoom']);
  const clampSpeed = value => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(2, Math.max(0.5, parsed)) : 1;
  };
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem('acta.interface.settings.v1')) || {}; } catch { /* Defaults apply. */ }
  const splashSpeed = clampSpeed(stored.splashAnimationSpeed);
  const splashEnabled = stored.splashAnimationEnabled !== false;

  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  // Pristine copy for replays: the settings panel re-runs the whole entrance +
  // leave choreography on a fresh clone inserted before .app-shell, so the
  // `.splash-screen ~ .app-shell` reveal selectors keep working.
  const splashTemplate = splash.cloneNode(true);

  const tauriInvoke = window.__TAURI__?.core?.invoke?.bind(window.__TAURI__.core);
  let revealed = false;
  const showWindow = () => {
    if (revealed || !tauriInvoke) return;
    revealed = true;
    tauriInvoke('reveal_window').catch(() => {});
  };
  const revealWindow = () => {
    if (revealed) return;
    requestAnimationFrame(() => requestAnimationFrame(showWindow));
  };
  if (tauriInvoke) {
    const isTransparentWindow = /Macintosh|MacIntel/i.test(`${navigator.platform} ${navigator.userAgent}`);
    const onLoaded = () => {
      revealWindow();
      if (isTransparentWindow) setTimeout(showWindow, 150);
    };
    // Wait for `load` so the webview has rendered the themed splash before the
    // native window shows; on the transparent macOS window a small grace timer
    // also reveals directly, in case the hidden webview never fires the rAFs.
    if (document.readyState === 'complete') onLoaded();
    else addEventListener('load', onLoaded, { once: true });
    setTimeout(showWindow, 2500);
  }

  if (!splashEnabled) {
    splash.remove();
  } else {
    startSplash(splash);
  }

  const replay = () => {
    document.getElementById('splashScreen')?.remove();
    const instance = splashTemplate.cloneNode(true);
    instance.classList.add('is-replaying');
    document.body.insertBefore(instance, document.querySelector('.app-shell'));
    startSplash(instance);
  };
  window.actaSplash = { replay };

  function startSplash(instance) {
    const logo = instance.querySelector('.splash-logo');
    let loaded = false, shown = false, left = false;
    const leave = () => {
      const reduceMotion = document.body.classList.contains('acta-reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) { instance.remove(); return; }
      // FLIP the logo onto the titlebar brand logo: match its exact position
      // and size (mini logo when the sidebar boots collapsed), then hand the
      // spot over when the splash layer fades away. The fly variables are read
      // by whichever preset's CSS actually performs the fly-out.
      const flyTarget = (() => {
        const brand = document.querySelector('.brand-logo');
        const mini = document.querySelector('.brand-mini-logo');
        if (mini && parseFloat(getComputedStyle(mini).opacity) > .5 && (!brand || parseFloat(getComputedStyle(brand).opacity) < .5)) return mini;
        return brand;
      })();
      if (flyTarget && logo) {
        const from = logo.getBoundingClientRect();
        const to = flyTarget.getBoundingClientRect();
        if (from.width > 0 && to.width > 0) {
          const rootStyle = document.documentElement.style;
          rootStyle.setProperty('--splash-fly-x', `${(to.left + to.width / 2 - (from.left + from.width / 2)).toFixed(1)}px`);
          rootStyle.setProperty('--splash-fly-y', `${(to.top + to.height / 2 - (from.top + from.height / 2)).toFixed(1)}px`);
          rootStyle.setProperty('--splash-fly-scale', `${(to.width / from.width).toFixed(4)}`);
        }
      }
      instance.classList.add('is-leaving');
      document.documentElement.classList.add('acta-app-reveal');
      instance.addEventListener('transitionend', event => { if (event.target === instance) instance.remove(); }, { once: true });
      setTimeout(() => instance.remove(), Math.round(2100 * splashSpeed));
    };
    const maybeLeave = () => { if (left || !loaded || !shown) return; left = true; leave(); };
    const markLoaded = () => { loaded = true; maybeLeave(); };
    if (document.readyState === 'complete') markLoaded();
    else addEventListener('load', markLoaded, { once: true });
    setTimeout(markLoaded, 5000);
    logo.addEventListener('animationend', () => { shown = true; maybeLeave(); }, { once: true });
    setTimeout(() => { shown = true; maybeLeave(); }, Math.round(1200 * splashSpeed));
  }
})();
