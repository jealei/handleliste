'use client'

import { useEffect } from 'react'
import { offentligSti } from '@/lib/config'

/**
 * Registrerer service workeren — men BARE i produksjon.
 *
 * I utvikling er en service worker aktivt skadelig: den svarer fra cache, så
 * man ser gamle sider i stedet for endringene sine, og feilsøkingen blir
 * meningsløs. Verre: har man først fått en registrert, blir man sittende fast
 * i den gamle cachen selv etter at feilen er rettet. Derfor rydder vi også
 * opp etter tidligere kjøringer i stedet for bare å la være å registrere.
 *
 * Registreringen skjer etter `load` slik at den ikke konkurrerer med den
 * første innlastingen, og feiler stille — en nettleser uten støtte skal
 * fortsatt kunne bruke lista.
 */
export function RegistrerSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      void ryddOppIUtvikling()
      return
    }

    const registrer = () => {
      navigator.serviceWorker
        .register(offentligSti('sw.js'), { scope: offentligSti('') })
        .catch(() => {})
    }

    if (document.readyState === 'complete') {
      registrer()
      return
    }
    window.addEventListener('load', registrer)
    return () => window.removeEventListener('load', registrer)
  }, [])

  return null
}

/** Fjerner service workere og cacher som er igjen fra tidligere kjøringer. */
async function ryddOppIUtvikling(): Promise<void> {
  try {
    const registreringer = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registreringer.map((r) => r.unregister()))

    if ('caches' in window) {
      const navn = await caches.keys()
      await Promise.all(navn.map((n) => caches.delete(n)))
    }
  } catch {
    // Opprydding er best effort — den skal aldri velte sida.
  }
}
