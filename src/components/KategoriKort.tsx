'use client'

import type { Kategori } from '@/data/handleliste'
import { antallIKategori } from '@/lib/filter'
import type { KjopKart } from '@/lib/lagring'
import { VareRad } from './VareRad'
import stiler from './KategoriKort.module.css'

type Props = {
  kategori: Kategori
  kjop: KjopKart
  onEndre: (id: string, antall: number) => void
}

export function KategoriKort({ kategori, kjop, onEndre }: Props) {
  const valgte = antallIKategori(kategori, kjop)

  return (
    <section className={stiler.kort} aria-labelledby={`kat-${kategori.id}`}>
      <h2 className={stiler.tittel} id={`kat-${kategori.id}`}>
        <span className={stiler.navn}>{kategori.navn}</span>
        {valgte > 0 && (
          <span className={stiler.merke} data-testid="antall-merke" aria-label={`${valgte} valgt`}>
            {valgte}
          </span>
        )}
      </h2>
      <ul className={stiler.liste}>
        {kategori.varer.map((vare) => (
          <VareRad
            key={vare.id}
            vare={vare}
            antall={kjop[vare.id] ?? 0}
            onEndre={onEndre}
          />
        ))}
      </ul>
    </section>
  )
}
