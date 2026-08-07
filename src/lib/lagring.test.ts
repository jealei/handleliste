import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NOKKEL_KJOP,
  NOKKEL_OPPLAST,
  erOpplast,
  lesKjop,
  settOpplast,
  skrivKjop,
  tommKjop,
} from './lagring'

beforeEach(() => window.localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('lesKjop / skrivKjop', () => {
  it('gir tomt kart når ingenting er lagret', () => {
    expect(lesKjop()).toEqual({})
  })

  it('skriver og leser tilbake', () => {
    skrivKjop({ 'godis-twist': 3 })
    expect(lesKjop()).toEqual({ 'godis-twist': 3 })
  })

  it('lagrer ikke nuller', () => {
    skrivKjop({ 'godis-twist': 0, 'godis-mandler': 2 })
    expect(lesKjop()).toEqual({ 'godis-mandler': 2 })
  })

  it('tåler korrupt JSON', () => {
    window.localStorage.setItem(NOKKEL_KJOP, '{ikke gyldig json')
    expect(lesKjop()).toEqual({})
  })

  it('tåler at lagret verdi er en array', () => {
    window.localStorage.setItem(NOKKEL_KJOP, '[1,2,3]')
    expect(lesKjop()).toEqual({})
  })

  it('tåler at lagret verdi er null', () => {
    window.localStorage.setItem(NOKKEL_KJOP, 'null')
    expect(lesKjop()).toEqual({})
  })

  it('filtrerer bort verdier som ikke er tall', () => {
    window.localStorage.setItem(NOKKEL_KJOP, '{"a":2,"b":"tre","c":null,"d":true}')
    expect(lesKjop()).toEqual({ a: 2 })
  })

  it('filtrerer bort negative verdier og NaN', () => {
    window.localStorage.setItem(NOKKEL_KJOP, '{"a":-1,"b":2}')
    expect(lesKjop()).toEqual({ b: 2 })
  })

  it('runder desimaltall ned', () => {
    window.localStorage.setItem(NOKKEL_KJOP, '{"a":2.7}')
    expect(lesKjop()).toEqual({ a: 2 })
  })

  it('krasjer ikke når localStorage kaster', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blokkert')
    })
    expect(() => lesKjop()).not.toThrow()
    expect(lesKjop()).toEqual({})
  })

  it('krasjer ikke når skriving kaster', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    expect(() => skrivKjop({ a: 1 })).not.toThrow()
  })
})

describe('tommKjop', () => {
  it('sletter alt', () => {
    skrivKjop({ a: 1 })
    tommKjop()
    expect(lesKjop()).toEqual({})
  })

  it('rører ikke opplåst-flagget', () => {
    settOpplast(true)
    tommKjop()
    expect(erOpplast()).toBe(true)
  })
})

describe('opplåst-flagget', () => {
  it('er usant til det settes', () => {
    expect(erOpplast()).toBe(false)
  })

  it('settes og leses', () => {
    settOpplast(true)
    expect(erOpplast()).toBe(true)
  })

  it('fjernes igjen', () => {
    settOpplast(true)
    settOpplast(false)
    expect(erOpplast()).toBe(false)
    expect(window.localStorage.getItem(NOKKEL_OPPLAST)).toBeNull()
  })

  it('godtar ikke vilkårlig verdi i nøkkelen', () => {
    window.localStorage.setItem(NOKKEL_OPPLAST, 'kanskje')
    expect(erOpplast()).toBe(false)
  })
})
