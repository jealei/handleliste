'use client'

import type { Vare } from '@/data/handleliste'
import stiler from './VareRad.module.css'

type Props = {
  vare: Vare
  antall: number
  onEndre: (id: string, antall: number) => void
}

export function VareRad({ vare, antall, onEndre }: Props) {
  const detaljer = [vare.merke, vare.forpakning].filter(Boolean).join(' · ')

  function skrevet(tekst: string) {
    // Fjern alt som ikke er siffer, slik at et tomt felt blir 0 og ikke NaN.
    const bare = tekst.replace(/\D/g, '')
    onEndre(vare.id, bare === '' ? 0 : Number.parseInt(bare, 10))
  }

  return (
    <li className={stiler.rad} data-valgt={antall > 0}>
      <div className={stiler.tekst}>
        <span className={stiler.navn}>{vare.vare}</span>
        {detaljer && <span className={stiler.detaljer}>{detaljer}</span>}
        {vare.kommentar && <span className={stiler.kommentar}>{vare.kommentar}</span>}
      </div>

      <div className={stiler.teller}>
        {vare.borHa && <span className={stiler.borHa}>Bør ha {vare.borHa}</span>}
        <button
          type="button"
          className={stiler.knapp}
          aria-label={`Færre ${vare.vare}`}
          disabled={antall === 0}
          onClick={() => onEndre(vare.id, antall - 1)}
        >
          −
        </button>
        <input
          className={stiler.felt}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={`Antall ${vare.vare}`}
          value={String(antall)}
          onChange={(e) => skrevet(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          className={stiler.knapp}
          aria-label={`Flere ${vare.vare}`}
          onClick={() => onEndre(vare.id, antall + 1)}
        >
          +
        </button>
      </div>
    </li>
  )
}
