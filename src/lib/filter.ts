import type { Kategori } from '@/data/handleliste'
import type { KjopKart } from './lagring'

/**
 * Reduserer lista til det som faktisk skal kjøpes.
 *
 * Returnerer nye objekter — kategoriene fra data-modulen er delt tilstand og
 * skal aldri muteres.
 */
export function filtrerHandletur(
  kategorier: readonly Kategori[],
  kjop: KjopKart,
): Kategori[] {
  return kategorier
    .map((kategori) => ({
      ...kategori,
      varer: kategori.varer.filter((vare) => (kjop[vare.id] ?? 0) > 0),
    }))
    .filter((kategori) => kategori.varer.length > 0)
}

/** Antall varelinjer som er valgt — ikke summen av antallene. */
export function antallValgte(kjop: KjopKart): number {
  return Object.values(kjop).filter((antall) => antall > 0).length
}

/** Antall valgte varelinjer innenfor én kategori. */
export function antallIKategori(kategori: Kategori, kjop: KjopKart): number {
  return kategori.varer.filter((vare) => (kjop[vare.id] ?? 0) > 0).length
}
