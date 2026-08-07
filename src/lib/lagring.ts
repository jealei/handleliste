/**
 * Innpakning rundt localStorage.
 *
 * Alle funksjoner er trygge å kalle under server-rendering (de returnerer
 * nøytrale verdier når `window` mangler) og trygge når localStorage kaster —
 * som i privat modus eller når nettleseren blokkerer lagring. Da faller vi
 * tilbake til et minnekart, slik at appen fungerer i økten selv om ingenting
 * overlever en omlasting.
 *
 * MERK: kall aldri disse under render. Statisk eksport betyr at HTML-en
 * bygges uten localStorage; leser du under render blir klient og server
 * ulike, og React klager på hydreringsavvik. Bruk useEffect.
 */
export type KjopKart = Record<string, number>

export const NOKKEL_KJOP = 'handleliste:kjop:v1'
export const NOKKEL_OPPLAST = 'handleliste:opplast:v1'

const RESERVE = new Map<string, string>()

function les(nokkel: string): string | null {
  try {
    return window.localStorage.getItem(nokkel)
  } catch {
    return RESERVE.get(nokkel) ?? null
  }
}

function skriv(nokkel: string, verdi: string): void {
  try {
    window.localStorage.setItem(nokkel, verdi)
  } catch {
    RESERVE.set(nokkel, verdi)
  }
}

function fjern(nokkel: string): void {
  try {
    window.localStorage.removeItem(nokkel)
  } catch {
    RESERVE.delete(nokkel)
  }
}

export function lesKjop(): KjopKart {
  if (typeof window === 'undefined') return {}

  const rå = les(NOKKEL_KJOP)
  if (!rå) return {}

  let tolket: unknown
  try {
    tolket = JSON.parse(rå)
  } catch {
    return {}
  }

  if (typeof tolket !== 'object' || tolket === null || Array.isArray(tolket)) return {}

  const kart: KjopKart = {}
  for (const [id, verdi] of Object.entries(tolket)) {
    if (typeof verdi === 'number' && Number.isFinite(verdi) && verdi > 0) {
      kart[id] = Math.floor(verdi)
    }
  }
  return kart
}

export function skrivKjop(kart: KjopKart): void {
  if (typeof window === 'undefined') return

  const rensket: KjopKart = {}
  for (const [id, verdi] of Object.entries(kart)) {
    if (verdi > 0) rensket[id] = verdi
  }
  skriv(NOKKEL_KJOP, JSON.stringify(rensket))
}

export function tommKjop(): void {
  if (typeof window === 'undefined') return
  fjern(NOKKEL_KJOP)
}

export function erOpplast(): boolean {
  if (typeof window === 'undefined') return false
  return les(NOKKEL_OPPLAST) === 'ja'
}

export function settOpplast(verdi: boolean): void {
  if (typeof window === 'undefined') return
  if (verdi) skriv(NOKKEL_OPPLAST, 'ja')
  else fjern(NOKKEL_OPPLAST)
}
