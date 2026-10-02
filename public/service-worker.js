const CACHE_NAME = 'acta-3.4.0-vite';
// 应用外壳只预缓存固定路径的文件；经 Vite 构建的 JS/CSS 带内容哈希、文件名
// 每次构建都会变化，交给下方 fetch 的运行时缓存（同源 200 响应均会写入）。
const APP_SHELL = [
  './', './index.html', './theme-boot.js', './manifest.webmanifest',
  './legacy/renderer.js', './lib/purify.min.js', './lib/pdf-lib.min.js', './lib/fontkit.umd.min.js',
  './icons/Acta_weblogo.png', './icons/flag-cn.svg', './icons/flag-us.svg',
  './icons/app-icon-positive-page.png', './icons/app-icon-outlined-page.png', './icons/app-icon-original-simple.png',
  './icons/icon-96.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-square.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    // Cache only complete same-origin 200s; error pages and 206 range responses
    // would otherwise poison the offline fallback.
    if (response.type === 'basic' && response.status === 200) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(clients => {
    const existing = clients.find(client => 'focus' in client);
    return existing ? existing.focus() : self.clients.openWindow('./index.html');
  }));
});
