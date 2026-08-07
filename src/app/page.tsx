'use client'

import { useEffect, useState } from 'react'
import { Handleliste } from '@/components/Handleliste'
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

  if (!klar) return null

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
