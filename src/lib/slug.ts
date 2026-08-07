/**
 * Lager en stabil id av tekstbiter.
 *
 * Id-ene brukes som nøkler i localStorage. De MÅ derfor være stabile over tid:
 * endres algoritmen, mister brukeren alle lagrede Kjøp-verdier. Endre den ikke
 * uten å også migrere lagringsnøkkelen.
 *
 * Norske tegn translittereres eksplisitt (æ→ae, ø→oe, å→aa) FØR
 * Unicode-normaliseringen, siden NFD ellers ville gjort «å» til «a» og
 * dermed kollapset «Rød»/«Rod» til samme id.
 */
const NORSKE_TEGN: Record<string, string> = { æ: 'ae', ø: 'oe', å: 'aa' }

export function slug(...deler: (string | undefined)[]): string {
  return deler
    .filter((del): del is string => Boolean(del && del.trim()))
    .join(' ')
    .toLowerCase()
    .replace(/[æøå]/g, (tegn) => NORSKE_TEGN[tegn])
    // NFD skiller grunntegn fra aksent; \p{M} fjerner aksentene. Skrevet som
    // Unicode-egenskap framfor kodepunktintervall fordi intervallet består av
    // usynlige tegn som er lette å ødelegge ved kopiering.
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
