'use client'

import { useEffect, useMemo, useState } from 'react'
import { KATEGORIER } from '@/data/handleliste'
import { antallValgte, filtrerHandletur } from '@/lib/filter'
import { type KjopKart, lesKjop, skrivKjop, tommKjop } from '@/lib/lagring'
import { KategoriKort } from './KategoriKort'
import { Rutenett } from './Rutenett'
import { Verktoylinje } from './Verktoylinje'
import stiler from './Handleliste.module.css'

export function Handleliste({ onLoggUt }: { onLoggUt: () => void }) {
  const [kjop, setKjop] = useState<KjopKart>({})
  const [handletur, setHandletur] = useState(false)
  // Skiller «ikke lest ennå» fra «lest, og tom». Uten dette ville effekten
  // under skrevet {} til localStorage ved montering og slettet alt.
  const [lastet, setLastet] = useState(false)

  useEffect(() => {
    setKjop(lesKjop())
    setLastet(true)
  }, [])

  useEffect(() => {
    if (lastet) skrivKjop(kjop)
  }, [kjop, lastet])

  function endre(id: string, antall: number) {
    const trygt = Math.max(0, Math.floor(antall))
    setKjop((forrige) => {
      const neste = { ...forrige }
      if (trygt === 0) delete neste[id]
      else neste[id] = trygt
      return neste
    })
  }

  function nullstill() {
    setKjop({})
    tommKjop()
  }

  const synlige = useMemo(
    () => (handletur ? filtrerHandletur(KATEGORIER, kjop) : KATEGORIER),
    [handletur, kjop],
  )

  return (
    <>
      <Verktoylinje
        antallValgte={antallValgte(kjop)}
        handletur={handletur}
        onBytteHandletur={() => setHandletur((v) => !v)}
        onNullstill={nullstill}
        onLoggUt={onLoggUt}
      />

      <main>
        {synlige.length === 0 ? (
          <p className={stiler.tom}>
            Du har ikke valgt noe å kjøpe ennå. Slå av handletur-modus for å se
            hele lista.
          </p>
        ) : (
          <Rutenett
            kategorier={synlige}
            renderKort={(kategori) => (
              <KategoriKort
                key={kategori.id}
                kategori={kategori}
                kjop={kjop}
                onEndre={endre}
              />
            )}
          />
        )}
      </main>
    </>
  )
}
