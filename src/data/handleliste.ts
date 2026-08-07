import { slug } from '@/lib/slug'
import { RADER, type Rad } from './rader'

export type Vare = {
  /** Stabil id. Brukes som nøkkel i localStorage — se lib/slug.ts. */
  id: string
  vare: string
  merke?: string
  /** Tekst, ikke tall: arket inneholder «1-2», «2-3» og «2?». */
  borHa?: string
  forpakning?: string
  kommentar?: string
}

export type Kategori = {
  id: string
  navn: string
  varer: Vare[]
}

/**
 * Grupperer flate rader til kategorier og regner ut id-er.
 *
 * Kaster ved duplikat vare-id. Det er med vilje: to varer med samme id ville
 * delt Kjøp-verdi i localStorage, og feilen ville vist seg som en teller som
 * «flytter seg selv» — nesten umulig å feilsøke. Bedre å stoppe ved bygging.
 */
export function byggKategorier(rader: readonly Rad[]): Kategori[] {
  const kategorier: Kategori[] = []
  const brukteIder = new Set<string>()

  for (const rad of rader) {
    let kategori = kategorier.find((k) => k.navn === rad.kategori)
    if (!kategori) {
      kategori = { id: slug(rad.kategori), navn: rad.kategori, varer: [] }
      kategorier.push(kategori)
    }

    const id = slug(rad.kategori, rad.vare, rad.merke)
    if (brukteIder.has(id)) {
      throw new Error(
        `Duplikat vare-id «${id}» (${rad.kategori} / ${rad.vare}). ` +
          'Gi varene ulikt merke i regnearket, eller utvid slug-nøkkelen.',
      )
    }
    brukteIder.add(id)

    kategori.varer.push({
      id,
      vare: rad.vare,
      merke: rad.merke,
      borHa: rad.borHa,
      forpakning: rad.forpakning,
      kommentar: rad.kommentar,
    })
  }

  return kategorier
}

export const KATEGORIER: readonly Kategori[] = byggKategorier(RADER)
