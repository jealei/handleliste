import { describe, expect, it } from 'vitest'
import { KATEGORIER } from '@/data/handleliste'
import { fordelISpalter, kategoriVekt } from './spalter'

const vekt = (n: number) => n

describe('fordelISpalter', () => {
  it('legger alt i én spalte når det bare er én', () => {
    expect(fordelISpalter([3, 1, 4], 1, vekt)).toEqual([[3, 1, 4]])
  })

  it('gir alltid like mange spalter som bedt om', () => {
    expect(fordelISpalter([5, 5, 5, 5], 3, vekt)).toHaveLength(3)
  })

  it('bevarer rekkefølgen innenfor hver spalte', () => {
    for (const spalte of fordelISpalter([1, 2, 3, 4, 5, 6], 2, vekt)) {
      const sortert = [...spalte].sort((a, b) => a - b)
      expect(spalte).toEqual(sortert)
    }
  })

  it('mister ingen elementer', () => {
    const inn = [7, 2, 9, 1, 4, 3]
    expect(fordelISpalter(inn, 3, vekt).flat().sort()).toEqual([...inn].sort())
  })

  it('fordeler jevnt når vektene er like', () => {
    const ut = fordelISpalter([1, 1, 1, 1, 1, 1], 3, vekt)
    expect(ut.map((s) => s.length)).toEqual([2, 2, 2])
  })

  it('lar ikke ett tungt element dra en spalte skjevt', () => {
    // Etterligner Pålegg (41) mot mange små kategorier.
    const ut = fordelISpalter([41, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], 2, vekt)
    const sum = ut.map((s) => s.reduce((a, b) => a + b, 0))
    const skjevhet = Math.abs(sum[0] - sum[1])
    expect(skjevhet).toBeLessThan(10)
  })

  it('tåler tom liste', () => {
    expect(fordelISpalter([], 3, vekt)).toEqual([[], [], []])
  })

  it('tåler færre elementer enn spalter', () => {
    const ut = fordelISpalter([5], 3, vekt)
    expect(ut[0]).toEqual([5])
    expect(ut.flat()).toHaveLength(1)
  })

  it('etterlater aldri en tom spalte når det finnes nok elementer', () => {
    const ut = fordelISpalter([2, 2, 2, 2, 2, 2], 3, vekt)
    expect(ut.every((s) => s.length > 0)).toBe(true)
  })
})

describe('med de virkelige kategoriene', () => {
  it('fordeler de 11 kategoriene rimelig jevnt på 2 spalter', () => {
    const spalter = fordelISpalter(KATEGORIER, 2, kategoriVekt)
    const sum = spalter.map((s) => s.reduce((a, k) => a + kategoriVekt(k), 0))
    const storst = Math.max(...sum)
    const minst = Math.min(...sum)
    // Faktisk forhold med dagens data er 1.03. Grensa er satt stramt med
    // vilje: en fordeling som sklir til 1.4 gir nettopp det tomrommet under
    // den korte spalta som denne koden finnes for å unngå.
    expect(storst / minst).toBeLessThan(1.15)
  })

  it('fordeler de 11 kategoriene rimelig jevnt på 3 spalter', () => {
    const spalter = fordelISpalter(KATEGORIER, 3, kategoriVekt)
    const sum = spalter.map((s) => s.reduce((a, k) => a + kategoriVekt(k), 0))
    expect(Math.max(...sum) / Math.min(...sum)).toBeLessThan(1.25)
    expect(spalter.every((s) => s.length > 0)).toBe(true)
  })

  it('tar med alle 11 kategoriene uansett spalteantall', () => {
    for (const n of [1, 2, 3]) {
      expect(fordelISpalter(KATEGORIER, n, kategoriVekt).flat()).toHaveLength(11)
    }
  })
})

describe('kategoriVekt', () => {
  it('teller varene pluss overskrifta', () => {
    const kategori = { id: 'a', navn: 'A', varer: [{ id: '1', vare: 'x' }] }
    expect(kategoriVekt(kategori)).toBeGreaterThan(1)
  })

  it('gir en kategori med én vare vekt over null', () => {
    expect(kategoriVekt({ id: 'a', navn: 'A', varer: [] })).toBeGreaterThan(0)
  })
})
