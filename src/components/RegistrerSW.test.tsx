import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RegistrerSW } from './RegistrerSW'

/**
 * Testene kjører med NODE_ENV=test, altså ikke «production». De dekker derfor
 * nettopp den grenen som gjorde utviklingsmiljøet ubrukelig: en service worker
 * som ble liggende igjen og servere gammel cache.
 */
const register = vi.fn()
const unregister = vi.fn()
const getRegistrations = vi.fn()
const cacheDelete = vi.fn()
const cacheKeys = vi.fn()

beforeEach(() => {
  register.mockReset().mockResolvedValue(undefined)
  unregister.mockReset().mockResolvedValue(true)
  getRegistrations.mockReset().mockResolvedValue([{ unregister }])
  cacheDelete.mockReset().mockResolvedValue(true)
  cacheKeys.mockReset().mockResolvedValue(['handleliste-v1'])

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { register, getRegistrations },
  })
  Object.defineProperty(window, 'caches', {
    configurable: true,
    value: { keys: cacheKeys, delete: cacheDelete },
  })
})

afterEach(() => {
  Reflect.deleteProperty(navigator, 'serviceWorker')
  Reflect.deleteProperty(window, 'caches')
})

describe('RegistrerSW utenfor produksjon', () => {
  it('registrerer ingen service worker', async () => {
    render(<RegistrerSW />)
    await waitFor(() => expect(getRegistrations).toHaveBeenCalled())
    expect(register).not.toHaveBeenCalled()
  })

  it('avregistrerer service workere fra tidligere kjøringer', async () => {
    render(<RegistrerSW />)
    await waitFor(() => expect(unregister).toHaveBeenCalled())
  })

  it('sletter gammel cache, slik at man ikke sitter fast i den', async () => {
    render(<RegistrerSW />)
    await waitFor(() => expect(cacheDelete).toHaveBeenCalledWith('handleliste-v1'))
  })

  it('krasjer ikke når opprydding feiler', async () => {
    getRegistrations.mockRejectedValue(new Error('nektet'))
    expect(() => render(<RegistrerSW />)).not.toThrow()
  })

  it('gjør ingenting når nettleseren mangler støtte', () => {
    Reflect.deleteProperty(navigator, 'serviceWorker')
    render(<RegistrerSW />)
    expect(register).not.toHaveBeenCalled()
    expect(getRegistrations).not.toHaveBeenCalled()
  })
})
