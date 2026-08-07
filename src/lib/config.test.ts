import { describe, expect, it } from 'vitest'
import { BASE_PATH, offentligSti } from './config'

describe('config', () => {
  it('har en basePath som er tom eller starter med skråstrek', () => {
    expect(BASE_PATH === '' || BASE_PATH.startsWith('/')).toBe(true)
  })

  it('har en basePath uten etterfølgende skråstrek', () => {
    expect(BASE_PATH.endsWith('/')).toBe(false)
  })

  it('bygger offentlige stier med prefiks', () => {
    expect(offentligSti('sw.js')).toBe(`${BASE_PATH}/sw.js`)
  })

  it('tåler at filnavnet allerede har ledende skråstrek', () => {
    expect(offentligSti('/ikon-192.png')).toBe(`${BASE_PATH}/ikon-192.png`)
  })

  it('lager aldri dobbel skråstrek', () => {
    expect(offentligSti('/sw.js')).not.toContain('//')
  })
})
