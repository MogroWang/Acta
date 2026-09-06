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
// Desktop (Tauri): the window is created hidden; after the splash has painted
// two frames we reveal it, so the first frame the user ever sees is the themed
// splash and never the native window background. Rust reveals it itself after
// a 3s grace period if this script never gets the chance to run.
// The splash is purely visual - it never intercepts pointer events, so early
// automation (e.g. smoke tests) is unaffected. Failsafes guarantee it can
// never block the UI: load and animationend each get a timeout fallback here,
// and CSS keyframes hide the splash and reveal the shell at 5.5s even if this
// script never ran at all.
(() => {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  const logo = splash.querySelector('.splash-logo');
  const tauriInvoke = window.__TAURI__?.core?.invoke?.bind(window.__TAURI__.core);
  if (tauriInvoke) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      tauriInvoke('reveal_window').catch(() => {});
    }));
  }
  let leaving = false, loaded = false, shown = false;
  const leave = () => {
    const reduceMotion = document.body.classList.contains('acta-reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { splash.remove(); return; }
    // FLIP the logo onto the titlebar brand logo: match its exact position and
    // size (mini logo when the sidebar boots collapsed), then hand the spot
    // over when the splash layer fades away.
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
    splash.classList.add('is-leaving');
    document.documentElement.classList.add('acta-app-reveal');
    splash.addEventListener('transitionend', event => { if (event.target === splash) splash.remove(); }, { once: true });
    setTimeout(() => splash.remove(), 2100);
  };
  const maybeLeave = () => { if (!leaving && loaded && shown) { leaving = true; leave(); } };
  const markLoaded = () => { loaded = true; maybeLeave(); };
  if (document.readyState === 'complete') markLoaded();
  else addEventListener('load', markLoaded, { once: true });
  setTimeout(markLoaded, 5000);
  logo.addEventListener('animationend', () => { shown = true; maybeLeave(); }, { once: true });
  setTimeout(() => { shown = true; maybeLeave(); }, 1200);
})();
