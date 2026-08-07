/*
 * Service worker for offline-bruk.
 *
 * Kan ikke importere BASE_PATH — fila serveres rå, uten bygging. Den utleder
 * i stedet omfanget sitt fra registration.scope under kjøring, og fungerer
 * dermed uansett hva basePath er satt til.
 *
 * To ulike strategier, og skillet er viktig:
 *
 *   Sidevisninger (navigate): NETTVERK FØRST, cache som reserve.
 *   Alt annet (_next, ikoner): CACHE FØRST.
 *
 * Forrige versjon svarte fra cache først også for sidevisninger. Det gjorde
 * at en side som en gang var lagret i ødelagt tilstand ble servert videre for
 * alltid — nettverket ble aldri spurt, så nye utrullinger nådde aldri fram,
 * og brukeren satt fast uten noen måte å komme ut av det på. Nettverk først
 * betyr at man alltid får siste versjon når man er på nett, og fremdeles har
 * en fungerende liste når man ikke er det.
 *
 * Ressursene under _next/ har innholdshash i filnavnet og endrer aldri
 * innhold, så der er cache først både trygt og raskt.
 */
const CACHE = 'handleliste-v2'
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

  if (foresporsel.mode === 'navigate') {
    event.respondWith(
      fetch(foresporsel)
        .then((svar) => {
          if (svar.ok) {
            const kopi = svar.clone()
            caches.open(CACHE).then((cache) => cache.put(ROT, kopi))
          }
          return svar
        })
        .catch(() => caches.match(ROT)),
    )
    return
  }

  event.respondWith(
    caches.match(foresporsel).then((truffet) => {
      if (truffet) return truffet
      return fetch(foresporsel).then((svar) => {
        if (svar.ok) {
          const kopi = svar.clone()
          caches.open(CACHE).then((cache) => cache.put(foresporsel, kopi))
        }
        return svar
      })
    }),
  )
})
