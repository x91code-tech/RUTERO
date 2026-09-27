const CACHE_NAME = "rutero-v2";
const CORE_ASSETS = ["/offline", "/manifest.webmanifest", "/icon.svg"];

function isInternalNextRequest(url) {
  return url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/sw.js" ||
    url.pathname === "/favicon.ico";
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || isInternalNextRequest(url)) return;

  const acceptsHtml = event.request.headers.get("accept")?.includes("text/html");
  if (!event.request.mode.includes("navigate") && !acceptsHtml) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match("/offline"))
  );
});
