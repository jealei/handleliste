'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import type { Kategori } from '@/data/handleliste'
import { fordelISpalter, kategoriVekt } from '@/lib/spalter'
import stiler from './Rutenett.module.css'

/**
 * Brytepunktene ligger her, ikke i CSS, fordi det er JavaScript som fordeler
 * kortene på spalter. To sannheter om det samme tallet ville før eller siden
 * kommet ut av synk.
 */
const TO_SPALTER = 640
const TRE_SPALTER = 1000

function beregnAntallSpalter(): number {
  if (typeof window === 'undefined') return 1
  const bredde = window.innerWidth
  if (bredde >= TRE_SPALTER) return 3
  if (bredde >= TO_SPALTER) return 2
  return 1
}

/**
 * Spaltebeholder for kategorikortene.
 *
 * Fordelingen regnes ut i JavaScript i stedet for med CSS `column-count`.
 * Se lib/spalter.ts for hvorfor — kort fortalt klarer ikke multi-column å
 * balansere når kortene er så ulike i høyde som her, og resultatet blir et
 * stort tomrom under den korteste spalta.
 *
 * Antall spalter følger vindusbredden og oppdateres ved resize, slik at
 * layouten henger med når telefonen brettes ut midt i bruk.
 */
export function Rutenett({
  kategorier,
  renderKort,
}: {
  kategorier: readonly Kategori[]
  renderKort: (kategori: Kategori) => ReactNode
}) {
  const [antall, setAntall] = useState(beregnAntallSpalter)

  useEffect(() => {
    const oppdater = () => setAntall(beregnAntallSpalter())
    oppdater()
    window.addEventListener('resize', oppdater)
    return () => window.removeEventListener('resize', oppdater)
  }, [])

  const spalter = useMemo(
    () => fordelISpalter(kategorier, antall, kategoriVekt),
    [kategorier, antall],
  )

  return (
    <div className={stiler.rutenett}>
      {spalter.map((spalte, i) => (
        <div className={stiler.spalte} key={i}>
          {spalte.map(renderKort)}
        </div>
      ))}
    </div>
  )
}
