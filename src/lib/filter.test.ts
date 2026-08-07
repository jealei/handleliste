import { describe, expect, it } from 'vitest'
import type { Kategori } from '@/data/handleliste'
import { antallIKategori, antallValgte, filtrerHandletur } from './filter'

const kategorier: Kategori[] = [
  {
    id: 'drikkevarer',
    navn: 'Drikkevarer',
    varer: [
      { id: 'a', vare: 'Melk' },
      { id: 'b', vare: 'Juice' },
    ],
  },
  { id: 'godis', navn: 'Godis', varer: [{ id: 'c', vare: 'Twist' }] },
]

describe('filtrerHandletur', () => {
  it('tar bare med varer med antall over null', () => {
    const ut = filtrerHandletur(kategorier, { a: 2 })
    expect(ut).toHaveLength(1)
    expect(ut[0].varer.map((v) => v.id)).toEqual(['a'])
  })

  it('fjerner kategorier som blir tomme', () => {
    const ut = filtrerHandletur(kategorier, { c: 1 })
    expect(ut.map((k) => k.navn)).toEqual(['Godis'])
  })

  it('gir tom liste når ingenting er valgt', () => {
    expect(filtrerHandletur(kategorier, {})).toEqual([])
  })

  it('regner null som ikke valgt', () => {
    expect(filtrerHandletur(kategorier, { a: 0 })).toEqual([])
  })

  it('endrer ikke det opprinnelige datasettet', () => {
    filtrerHandletur(kategorier, { a: 1 })
    expect(kategorier[0].varer).toHaveLength(2)
  })

  it('bevarer rekkefølgen', () => {
    const ut = filtrerHandletur(kategorier, { b: 1, c: 1 })
    expect(ut.map((k) => k.navn)).toEqual(['Drikkevarer', 'Godis'])
  })
})

describe('antallValgte', () => {
  it('teller varelinjer, ikke summen av antall', () => {
    expect(antallValgte({ a: 5, b: 2 })).toBe(2)
  })

  it('ser bort fra nuller', () => {
    expect(antallValgte({ a: 0, b: 1 })).toBe(1)
  })

  it('er null for tomt kart', () => {
    expect(antallValgte({})).toBe(0)
  })
})

describe('antallIKategori', () => {
  it('teller valgte varer i én kategori', () => {
    expect(antallIKategori(kategorier[0], { a: 1, c: 9 })).toBe(1)
  })

  it('er null når ingenting er valgt', () => {
    expect(antallIKategori(kategorier[0], {})).toBe(0)
  })
})
