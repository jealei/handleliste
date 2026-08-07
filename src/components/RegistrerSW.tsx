'use client'

import { useEffect } from 'react'
import { offentligSti } from '@/lib/config'

/**
 * Registrerer service workeren etter at sida er lastet, slik at den ikke
 * konkurrerer med den første innlastingen. Feiler stille — en nettleser uten
 * støtte skal fortsatt kunne bruke lista.
 */
export function RegistrerSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

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
