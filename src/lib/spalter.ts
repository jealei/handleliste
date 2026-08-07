import type { Kategori } from '@/data/handleliste'

/**
 * Omtrentlig høyde på et kategorikort, målt i «radhøyder».
 *
 * Overskrifta og kortkanten koster omtrent to raders høyde. Presisjonen
 * trenger ikke være stor — den skal bare hindre at en kategori med én vare
 * regnes som nesten vektløs.
 */
const OVERSKRIFT = 2

export function kategoriVekt(kategori: Kategori): number {
  return kategori.varer.length + OVERSKRIFT
}

/**
 * Fordeler elementer på spalter slik at spaltene blir omtrent like høye.
 *
 * Hvorfor dette gjøres i JavaScript i stedet for med CSS `column-count`:
 * multi-column balanserer ved å ANSLÅ hvor høy hver spalte blir, men
 * `break-inside: avoid` forbyr å dele et kort. Med kategorier så ulike som
 * Pålegg (41 varer) og «Sesongvarer, jul» (1) spriker anslaget kraftig fra
 * den faktiske plasseringen, og resultatet er at én spalte tar slutt lenge
 * før den andre — et stort tomrom midt i lista.
 *
 * Her er høydene kjent på forhånd, så fordelingen kan regnes ut eksakt.
 *
 * Framgangsmåten er to steg:
 *
 *   1. Plasser det TYNGSTE elementet først, i den spalta som er lavest.
 *      Å ta de store først er det som gjør balansen god — tar man dem i
 *      vilkårlig rekkefølge, kommer et stort element til slutt og har ingen
 *      steder å gjøre av seg uten å velte balansen.
 *   2. Sorter hver spalte tilbake til opprinnelig rekkefølge.
 *
 * Steg 2 er poenget med å dele det i to: fordelingen bestemmes av høyde,
 * men det man LESER er fortsatt kategoriene i regnearkets rekkefølge nedover
 * hver spalte. Uten steg 2 ville kortene stått sortert etter størrelse.
 *
 * Med dagens data gir dette spaltehøyder på 68 og 66 mot 46 og 88 for en
 * fordeling som fyller spalte for spalte slik CSS multi-column gjør.
 */
export function fordelISpalter<T>(
  elementer: readonly T[],
  antallSpalter: number,
  vekt: (element: T) => number,
): T[][] {
  if (antallSpalter <= 1) return [[...elementer]]

  const spalter: number[][] = Array.from({ length: antallSpalter }, () => [])
  const hoyder = new Array<number>(antallSpalter).fill(0)

  const tyngstForst = elementer
    .map((element, indeks) => ({ indeks, w: vekt(element) }))
    .sort((a, b) => b.w - a.w || a.indeks - b.indeks)

  for (const { indeks, w } of tyngstForst) {
    let lavest = 0
    for (let i = 1; i < antallSpalter; i += 1) {
      if (hoyder[i] < hoyder[lavest]) lavest = i
    }
    spalter[lavest].push(indeks)
    hoyder[lavest] += w
  }

  return spalter.map((indekser) =>
    indekser.sort((a, b) => a - b).map((i) => elementer[i]),
  )
}
