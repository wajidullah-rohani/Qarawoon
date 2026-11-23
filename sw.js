"use strict";

const CACHE_VERSION = "qarawoon-v1.0.2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async function (cache) {
      for (let i = 0; i < CORE_ASSETS.length; i++) {
        const assetUrl = CORE_ASSETS[i];
        try {
          const response = await fetch(assetUrl, { cache: "no-store" });
          if (response && response.ok) {
            await cache.put(assetUrl, response);
          }
        } catch {
          // If an optional file is absent, continue caching available files
        }
      }
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_VERSION;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const isNavigation =
    event.request.mode === "navigate" ||
    requestUrl.pathname.endsWith(".html") ||
    requestUrl.pathname.endsWith("/");

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then(async function (networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_VERSION);
            await cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async function () {
          const cache = await caches.open(CACHE_VERSION);
          return (
            (await cache.match(event.request)) ||
            (await cache.match("./index.html")) ||
            (await cache.match("./")) ||
            new Response("آفلاین حالت: مهرباني وکړئ لومړی یو ځل له انټرنیټ سره وصل شئ.", {
              status: 503,
              statusText: "Service Unavailable",
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            })
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_VERSION).then(async function (cache) {
      const cachedResponse = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then(async function (networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            await cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(function () {
          return null;
        });

      if (cachedResponse) {
        return cachedResponse;
      }

      const freshResponse = await networkFetch;
      return freshResponse || new Response("", { status: 504, statusText: "Gateway Timeout" });
    })
  );
}); 
