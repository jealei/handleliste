import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Verktoylinje } from './Verktoylinje'

function oppsett(overstyr = {}) {
  const props = {
    antallValgte: 0,
    handletur: false,
    onBytteHandletur: vi.fn(),
    onNullstill: vi.fn(),
    onLoggUt: vi.fn(),
    ...overstyr,
  }
  render(<Verktoylinje {...props} />)
  return props
}

describe('Verktoylinje', () => {
  it('viser antall valgte varer', () => {
    oppsett({ antallValgte: 7 })
    expect(screen.getByText(/7/)).toBeInTheDocument()
  })

  it('bytter handletur-modus', async () => {
    const props = oppsett()
    await userEvent.click(screen.getByRole('switch', { name: /handletur/i }))
    expect(props.onBytteHandletur).toHaveBeenCalledOnce()
  })

  it('viser modusen i switch-tilstanden', () => {
    oppsett({ handletur: true })
    expect(screen.getByRole('switch', { name: /handletur/i })).toBeChecked()
  })

  it('logger ut', async () => {
    const props = oppsett()
    await userEvent.click(screen.getByRole('button', { name: /logg ut/i }))
    expect(props.onLoggUt).toHaveBeenCalledOnce()
  })
})

describe('Nullstill', () => {
  it('sletter ingenting på første trykk', async () => {
    const props = oppsett()
    await userEvent.click(screen.getByRole('button', { name: /nullstill/i }))
    expect(props.onNullstill).not.toHaveBeenCalled()
  })

  it('ber om bekreftelse på første trykk', async () => {
    oppsett()
    await userEvent.click(screen.getByRole('button', { name: /nullstill/i }))
    expect(screen.getByRole('button', { name: /sikker/i })).toBeInTheDocument()
  })

  it('sletter på andre trykk', async () => {
    const props = oppsett()
    await userEvent.click(screen.getByRole('button', { name: /nullstill/i }))
    await userEvent.click(screen.getByRole('button', { name: /sikker/i }))
    expect(props.onNullstill).toHaveBeenCalledOnce()
  })

  // Denne ene testen trenger falske timere for å hoppe over ventetiden.
  // userEvent og falske timere i Vitest låser seg mot hverandre, så her
  // brukes fireEvent — et enkelt knappetrykk trenger ikke mer.
  it('avvæpnes når man venter', () => {
    vi.useFakeTimers()
    try {
      const props = oppsett()
      fireEvent.click(screen.getByRole('button', { name: /nullstill/i }))
      expect(screen.getByRole('button', { name: /sikker/i })).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(4500)
      })

      expect(screen.getByRole('button', { name: /nullstill/i })).toBeInTheDocument()
      expect(props.onNullstill).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
