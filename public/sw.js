/*
 * Enkel service worker: precacher app-skallet og serverer cache-først.
 *
 * Kan ikke importere BASE_PATH — fila serveres rå, uten bygging. Den utleder
 * i stedet omfanget sitt fra registration.scope under kjøring, og fungerer
 * dermed uansett hva basePath er satt til.
 */
const CACHE = 'handleliste-v1'
const ROT = new URL(self.registration.scope).pathname

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([ROT]))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((navn) =>
        Promise.all(navn.filter((n) => n !== CACHE).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const foresporsel = event.request
  if (foresporsel.method !== 'GET') return
  if (new URL(foresporsel.url).origin !== self.location.origin) return

  event.respondWith(
    caches.match(foresporsel).then((truffet) => {
      if (truffet) return truffet
      return fetch(foresporsel)
        .then((svar) => {
          if (svar.ok) {
            const kopi = svar.clone()
            caches.open(CACHE).then((cache) => cache.put(foresporsel, kopi))
          }
          return svar
        })
        .catch(() => caches.match(ROT))
    }),
  )
})
