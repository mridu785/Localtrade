const VERSION = "v1.0.0";
const STATIC_CACHE = `axb-static-${VERSION}`;
const RUNTIME_CACHE = `axb-runtime-${VERSION}`;
const OFFLINE_URL = "./offline.html";

const PRECACHE = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./assets/logo/logo.svg",
  "./assets/icons/icon.svg",
  "./assets/icons/maskable.svg",
  "./css/variables.css",
  "./css/reset.css",
  "./css/global.css",
  "./css/layout.css",
  "./css/components.css",
  "./css/responsive.css",
  "./css/home.css",
  "./css/search.css",
  "./css/listing.css",
  "./css/sell.css",
  "./css/chat.css",
  "./css/profile.css",
  "./css/settings.css",
  "./js/app.js",
  "./js/router.js",
  "./js/config/firebase-config.js",
  "./js/config/app-config.js",
  "./js/firebase/firebase-init.js",
  "./js/firebase/auth.js",
  "./js/firebase/firestore.js",
  "./js/firebase/app-check.js",
  "./js/components/toast.js",
  "./js/components/icons.js",
  "./js/components/loader.js",
  "./js/utils/helpers.js",
  "./js/utils/formatters.js",
  "./js/utils/storage.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith("axb-") && k !== STATIC_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.includes("/__/") || url.pathname.endsWith("firebase-messaging-sw.js")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL)) || (await caches.match("./index.html")))
    );
    return;
  }

  const destination = request.destination;
  if (["style", "script", "image", "font"].includes(destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});