'use client'

import { type FormEvent, useState } from 'react'
import stiler from './Passordlas.module.css'

/**
 * MERK: dette er skjuling, ikke sikkerhet.
 *
 * Strengen ligger i JavaScript-bundelen og kan leses av hvem som helst med
 * utviklerverktøy. Den holder lista unna tilfeldige forbipasserende på en
 * offentlig URL — ingenting mer. Ikke legg noe hemmelig i denne appen.
 *
 * Hashing ville ikke hjulpet: den som kan lese hashen kan lese koden som
 * sammenligner den, og ville bare gitt en falsk følelse av trygghet.
 */
const PASSORD = 'Tønsberg!'

export function Passordlas({ onApnet }: { onApnet: () => void }) {
  const [verdi, setVerdi] = useState('')
  const [feil, setFeil] = useState(false)

  function send(e: FormEvent) {
    e.preventDefault()
    if (verdi.trim() === PASSORD) onApnet()
    else setFeil(true)
  }

  return (
    <main className={stiler.skjerm}>
      <form className={stiler.kort} onSubmit={send}>
        <h1 className={stiler.tittel}>Handleliste</h1>
        <p className={stiler.undertittel}>Tønsberg</p>

        <label className={stiler.merkelapp} htmlFor="passord">
          Passord
        </label>
        <input
          id="passord"
          className={stiler.felt}
          type="password"
          value={verdi}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="current-password"
          onChange={(e) => {
            setVerdi(e.target.value)
            setFeil(false)
          }}
        />

        {feil && (
          <p className={stiler.feil} role="alert">
            Feil passord.
          </p>
        )}

        <button className={stiler.knapp} type="submit">
          Logg inn
        </button>
      </form>
    </main>
  )
}
