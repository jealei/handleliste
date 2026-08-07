import { describe, expect, it } from 'vitest'
import { KATEGORIER, byggKategorier } from './handleliste'
import type { Rad } from './rader'

describe('KATEGORIER', () => {
  it('har 11 kategorier', () => {
    expect(KATEGORIER).toHaveLength(11)
  })

  it('har 112 varer til sammen', () => {
    const antall = KATEGORIER.reduce((sum, k) => sum + k.varer.length, 0)
    expect(antall).toBe(112)
  })

  it('bevarer rekkefølgen fra regnearket', () => {
    expect(KATEGORIER.map((k) => k.navn)).toEqual([
      'Drikkevarer',
      'Bakevarer',
      'Tørrvare / hermetikk / krydder',
      'Frukt / grønt',
      'Pålegg',
      'Rengjøring / kjøkkenartikler',
      'Godis',
      'Diverse',
      'Sesongvarer, jul',
      'Sesongvarer, sommer',
      'Varmmat',
    ])
  })

  it('gir hver vare en unik id', () => {
    const ider = KATEGORIER.flatMap((k) => k.varer.map((v) => v.id))
    expect(new Set(ider).size).toBe(ider.length)
  })

  it('gir bare id-er med trygge tegn', () => {
    for (const kategori of KATEGORIER) {
      expect(kategori.id).toMatch(/^[a-z0-9-]+$/)
      for (const vare of kategori.varer) {
        expect(vare.id).toMatch(/^[a-z0-9-]+$/)
      }
    }
  })

  it('har ingen varer uten navn', () => {
    for (const kategori of KATEGORIER) {
      for (const vare of kategori.varer) {
        expect(vare.vare.trim()).not.toBe('')
      }
    }
  })

  it('skiller de to Ketchup-radene', () => {
    const paalegg = KATEGORIER.find((k) => k.navn === 'Pålegg')!
    const ketchup = paalegg.varer.filter((v) => v.vare === 'Ketchup')
    expect(ketchup).toHaveLength(2)
    expect(ketchup[0].id).not.toBe(ketchup[1].id)
  })

  it('beholder borHa som tekst, også for intervaller', () => {
    const alle = KATEGORIER.flatMap((k) => k.varer)
    const intervall = alle.find((v) => v.borHa?.includes('-'))
    expect(intervall).toBeDefined()
    expect(typeof intervall!.borHa).toBe('string')
  })
})

describe('byggKategorier', () => {
  it('grupperer rader under kategorinavnet sitt', () => {
    const rader: Rad[] = [
      { kategori: 'Drikkevarer', vare: 'Melk' },
      { kategori: 'Drikkevarer', vare: 'Juice' },
      { kategori: 'Godis', vare: 'Twist' },
    ]
    const bygget = byggKategorier(rader)
    expect(bygget).toHaveLength(2)
    expect(bygget[0].varer.map((v) => v.vare)).toEqual(['Melk', 'Juice'])
    expect(bygget[1].varer.map((v) => v.vare)).toEqual(['Twist'])
  })

  it('utleder id fra kategori, vare og merke', () => {
    const bygget = byggKategorier([{ kategori: 'Pålegg', vare: 'Ketchup', merke: 'Idun' }])
    expect(bygget[0].varer[0].id).toBe('paalegg-ketchup-idun')
    expect(bygget[0].id).toBe('paalegg')
  })

  it('kaster ved duplikat id i stedet for å miste data stille', () => {
    const rader: Rad[] = [
      { kategori: 'Godis', vare: 'Twist' },
      { kategori: 'Godis', vare: 'Twist' },
    ]
    expect(() => byggKategorier(rader)).toThrow(/[Dd]uplikat/)
  })

  it('lar samme varenavn leve i ulike kategorier', () => {
    const rader: Rad[] = [
      { kategori: 'Frukt / grønt', vare: 'Løk' },
      { kategori: 'Varmmat', vare: 'Løk' },
    ]
    expect(() => byggKategorier(rader)).not.toThrow()
  })
})
