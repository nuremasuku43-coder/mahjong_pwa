const CACHE_NAME = "mahjong-cache-v3";

const FILES_TO_CACHE = [
  "/",
  "/templates/index.html",
  "/static/manifest.json",
  "/static/app.js",
  "/static/style.css",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png"
];

// インストール時にキャッシュ
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// 古いキャッシュを削除しつつ、更新を通知
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );

  // ★ 更新があることをクライアントに通知
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: "UPDATE_AVAILABLE" });
    });
  });

  self.clients.claim();
});

// オフライン対応（キャッシュ優先）
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
