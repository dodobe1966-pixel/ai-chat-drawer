/* AI Chat Drawer, phone edition: keeps the app shell on the phone so it opens without a network.
 * The builder fills in the file list and a version made from the file contents. Saved chats are in IndexedDB, not here. */
"use strict";
const VERSION = "phone1-727a2ec03cf4";
const CACHE = "ai-chat-drawer-shell-" + VERSION;
const FILES = ["./", "app.js", "assets/app-icon.png", "assets/covers/p01.webp", "assets/covers/p02.webp", "assets/covers/p03.webp", "assets/covers/p04.webp", "assets/covers/p05.webp", "assets/covers/p06.webp", "assets/covers/p07.webp", "assets/covers/p08.webp", "assets/covers/p09.webp", "assets/covers/p10.webp", "assets/covers/p11.webp", "assets/covers/p12.webp", "assets/hero-mech.webp", "assets/logo-intro.js", "assets/logo-motion.webp", "guide.html", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-192.png", "icons/maskable-512.png", "index.html", "manifest.webmanifest", "phone-api.js", "phone-count.js", "phone-import.js", "phone-sync.js", "phone-tables.js", "pwa-boot.js", "styles.css"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith("ai-chat-drawer-shell-") && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(caches.match(request, { ignoreSearch: true })
      .then(hit => hit || caches.match("index.html"))
      .then(hit => hit || fetch(request)));
    return;
  }
  event.respondWith(caches.match(request, { ignoreSearch: true }).then(hit => hit || fetch(request)));
});
