'use client'

import { useEffect, useState } from 'react'
import { Handleliste } from '@/components/Handleliste'
import { Laster } from '@/components/Laster'
import { Passordlas } from '@/components/Passordlas'
import { erOpplast, settOpplast } from '@/lib/lagring'

export default function Side() {
  const [opplast, setOpplast] = useState(false)
  // Låst-tilstanden kan ikke leses under render (statisk eksport har ingen
  // localStorage), så vi venter én runde før vi bestemmer hva som vises.
  // Uten dette blinker innloggingsskjermen for en bruker som er logget inn.
  const [klar, setKlar] = useState(false)

  useEffect(() => {
    setOpplast(erOpplast())
    setKlar(true)
  }, [])

  // Aldri `null` her: da blir den ferdigbygde HTML-en tom, og en side som
  // ikke får kjørt JavaScript viser bare en svart skjerm uten forklaring.
  if (!klar) return <Laster />

  if (!opplast) {
    return (
      <Passordlas
        onApnet={() => {
          settOpplast(true)
          setOpplast(true)
        }}
      />
    )
  }

  return (
    <Handleliste
      onLoggUt={() => {
        settOpplast(false)
        setOpplast(false)
      }}
    />
  )
}
