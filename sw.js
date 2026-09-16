const CACHE_NAME = "wordle-clone-v2";
const BASE_PATH = "/wordle-clone/";

const APP_FILES = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.webmanifest`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const cached = await caches.match(request);

  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    if (cached) return cached;

    if (request.mode === "navigate") {
      return caches.match(`${BASE_PATH}index.html`);
    }

    return Response.error();
  }
}