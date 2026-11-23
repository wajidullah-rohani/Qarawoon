"use strict";

const CACHE_VERSION = "qarawoon-v1.0.3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/**
 * Caches core assets during service worker installation.
 * @returns {Promise<void>}
 */
async function cacheInitialAssets() {
  const cache = await caches.open(CACHE_VERSION);
  for (let i = 0; i < CORE_ASSETS.length; i++) {
    const assetUrl = CORE_ASSETS[i];
    try {
      const response = await fetch(assetUrl, { cache: "no-store" });
      if (response && response.ok) {
        await cache.put(assetUrl, response);
      }
    } catch {
      // Skip optional assets if not present
    }
  }
}

/**
 * Removes old cache versions and claims active clients.
 * @returns {Promise<void>}
 */
async function cleanupOldCaches() {
  const keys = await caches.keys();
  const staleKeys = keys.filter(function (key) {
    return key !== CACHE_VERSION;
  });

  await Promise.all(
    staleKeys.map(function (key) {
      return caches.delete(key);
    })
  );

  await self.clients.claim();
}

/**
 * Network-first strategy for HTML/navigation requests with offline fallback.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function respondNavigation(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match("./index.html")) ||
      (await cache.match("./")) ||
      new Response("آفلاین حالت: مهرباني وکړئ لومړی یو ځل له انټرنیټ سره وصل شئ.", {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      })
    );
  }
}

/**
 * Cache-first strategy with background update for static and same-origin GET assets.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function respondStatic(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then(async function (networkResponse) {
      if (networkResponse && networkResponse.status === 200) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(function () {
      return null;
    });

  if (cachedResponse) {
    return cachedResponse;
  }

  const freshResponse = await networkPromise;
  return freshResponse || new Response("", { status: 504, statusText: "Gateway Timeout" });
}

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(cacheInitialAssets());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(cleanupOldCaches());
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
    event.respondWith(respondNavigation(event.request));
  } else {
    event.respondWith(respondStatic(event.request));
  }
}); 
