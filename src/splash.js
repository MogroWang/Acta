// Boot splash: shows the Acta wordmark centered while the page loads. The
// splash leaves only once BOTH conditions are met - the page finished loading
// (window load) and the logo's entrance animation has played out - so a fast
// local load can never cut the wordmark off before it was seen. Leaving is
// staged: the logo scales up and fades out while the layer still covers the
// workspace, divider lines mirroring the workspace's real borders then draw
// themselves across the paper, and finally the layer cross-fades with the
// workspace reveal (acta-app-reveal on <html> starts the shell's fade-in at
// the same moment).
// The splash is purely visual - it never intercepts pointer events, so early
// automation (e.g. smoke tests) is unaffected. Failsafes guarantee it can
// never block the UI: load and animationend each get a timeout fallback here,
// and CSS keyframes hide the splash and reveal the shell at 5.5s even if this
// script never ran at all.
(() => {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  const logo = splash.querySelector('.splash-logo');
  let leaving = false, loaded = false, shown = false;
  const leave = () => {
    const reduceMotion = document.body.classList.contains('acta-reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { splash.remove(); return; }
    splash.classList.add('is-leaving');
    document.documentElement.classList.add('acta-app-reveal');
    splash.addEventListener('transitionend', event => { if (event.target === splash) splash.remove(); }, { once: true });
    setTimeout(() => splash.remove(), 2300);
  };
  const maybeLeave = () => { if (!leaving && loaded && shown) { leaving = true; leave(); } };
  const markLoaded = () => { loaded = true; maybeLeave(); };
  if (document.readyState === 'complete') markLoaded();
  else addEventListener('load', markLoaded, { once: true });
  setTimeout(markLoaded, 5000);
  logo.addEventListener('animationend', () => { shown = true; maybeLeave(); }, { once: true });
  setTimeout(() => { shown = true; maybeLeave(); }, 1200);
})();
