// Minimal service worker — required for iOS "Add to Home Screen" PWA install
// and to keep the app shell installable. No aggressive caching: Next.js handles
// asset hashing, and we want fresh data when online.

const CACHE = "lipe-crm-v1"
const APP_SHELL = ["/dashboard"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return

  const url = new URL(req.url)
  // Never cache API/auth/server actions — always go to network.
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/_next/data")) {
    return
  }

  // Network-first for navigations, fall back to cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/dashboard"))),
    )
  }
})
