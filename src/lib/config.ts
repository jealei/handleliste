/**
 * Stien appen serveres under på GitHub Pages.
 *
 * Dette er ENESTE sted repo-navnet står. Endres repoet til noe annet, endres
 * denne konstanten — ingenting annet.
 *
 * Tom streng betyr at appen ligger på domenerota (bruker- eller org-side).
 * Ellers må verdien starte med "/" og ikke slutte med "/".
 *
 * Typen er eksplisitt `string`, ikke den utledede literalen. Uten det
 * innsnevrer TypeScript verdien til «/handleliste» og avviser testen som
 * sjekker tom streng som en umulig sammenligning — en sjekk som er nettopp
 * det vi vil ha, siden konstanten er ment å endres.
 */
export const BASE_PATH: string = '/handleliste'

/** Bygger en absolutt sti til en fil i `public/`, med riktig prefiks. */
export function offentligSti(fil: string): string {
  return `${BASE_PATH}/${fil.replace(/^\//, '')}`
}
