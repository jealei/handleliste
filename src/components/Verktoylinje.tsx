'use client'

import { useEffect, useState } from 'react'
import stiler from './Verktoylinje.module.css'

const BEKREFT_MS = 4000

type Props = {
  antallValgte: number
  handletur: boolean
  onBytteHandletur: () => void
  onNullstill: () => void
  onLoggUt: () => void
}

export function Verktoylinje({
  antallValgte,
  handletur,
  onBytteHandletur,
  onNullstill,
  onLoggUt,
}: Props) {
  // To-trinns sletting: ett feiltrykk skal ikke kunne slette ekte arbeid.
  const [bekrefter, setBekrefter] = useState(false)

  useEffect(() => {
    if (!bekrefter) return
    const id = setTimeout(() => setBekrefter(false), BEKREFT_MS)
    return () => clearTimeout(id)
  }, [bekrefter])

  function trykkNullstill() {
    if (bekrefter) {
      setBekrefter(false)
      onNullstill()
    } else {
      setBekrefter(true)
    }
  }

  return (
    <header className={stiler.linje}>
      <div className={stiler.venstre}>
        <span className={stiler.tittel}>Handleliste</span>
        <span className={stiler.antall}>{antallValgte} valgt</span>
      </div>

      <div className={stiler.hoyre}>
        <button
          type="button"
          role="switch"
          aria-checked={handletur}
          className={stiler.bryter}
          onClick={onBytteHandletur}
        >
          Handletur
        </button>

        <button
          type="button"
          className={bekrefter ? stiler.fareAktiv : stiler.fare}
          onClick={trykkNullstill}
        >
          {bekrefter ? 'Sikker?' : 'Nullstill'}
        </button>

        <button type="button" className={stiler.knapp} onClick={onLoggUt}>
          Logg ut
        </button>
      </div>
    </header>
  )
}
