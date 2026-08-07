import type { ReactNode } from 'react'
import stiler from './Rutenett.module.css'

/**
 * Spaltebeholder for kategorikortene.
 *
 * Bruker CSS multi-column framfor grid fordi kortene har svært ulik høyde
 * (Pålegg har 41 varer, «Sesongvarer, jul» har 1). Grid ville gitt store hull.
 * Brytepunktene følger bredde, ikke enhet, slik at layouten følger med når
 * telefonen brettes ut midt i bruk.
 */
export function Rutenett({ children }: { children: ReactNode }) {
  return <div className={stiler.rutenett}>{children}</div>
}
