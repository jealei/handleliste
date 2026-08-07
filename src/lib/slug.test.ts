import { describe, expect, it } from 'vitest'
import { slug } from './slug'

describe('slug', () => {
  it('gjør om til små bokstaver', () => {
    expect(slug('Eplejuice')).toBe('eplejuice')
  })

  it('translittererer norske tegn', () => {
    expect(slug('Pålegg')).toBe('paalegg')
    expect(slug('Tørrvare')).toBe('toerrvare')
    expect(slug('Rød løk')).toBe('roed-loek')
  })

  it('fjerner aksenter fra andre latinske tegn', () => {
    expect(slug('Gräddost')).toBe('graddost')
  })

  it('slår sammen skilletegn og mellomrom til én bindestrek', () => {
    expect(slug('Tørrvare / hermetikk / krydder')).toBe('toerrvare-hermetikk-krydder')
  })

  it('fjerner ledende og etterfølgende bindestreker', () => {
    expect(slug('  Kaffe, filtermalt  ')).toBe('kaffe-filtermalt')
  })

  it('setter sammen flere deler', () => {
    expect(slug('Pålegg', 'Ketchup', 'Idun')).toBe('paalegg-ketchup-idun')
  })

  it('hopper over tomme og udefinerte deler', () => {
    expect(slug('Pålegg', 'Eggesalat', undefined)).toBe('paalegg-eggesalat')
    expect(slug('Pålegg', 'Eggesalat', '')).toBe('paalegg-eggesalat')
    expect(slug('Pålegg', 'Eggesalat', '   ')).toBe('paalegg-eggesalat')
  })

  it('skiller varer som bare er ulike på merke', () => {
    expect(slug('Pålegg', 'Ketchup', 'Idun')).not.toBe(slug('Pålegg', 'Ketchup', 'Heinz'))
  })

  it('gir bare tegn som er trygge i en id', () => {
    expect(slug('Fun Light, variere smak')).toMatch(/^[a-z0-9-]+$/)
    expect(slug('Batterier AA')).toMatch(/^[a-z0-9-]+$/)
    expect(slug('Knekkebrød, Finn Crisp original')).toMatch(/^[a-z0-9-]+$/)
  })

  it('gir tom streng når ingenting er igjen', () => {
    expect(slug('///')).toBe('')
    expect(slug()).toBe('')
  })
})
