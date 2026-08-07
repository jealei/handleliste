import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Passordlas } from './Passordlas'

async function skrivOgSend(passord: string) {
  await userEvent.type(screen.getByLabelText(/passord/i), passord)
  await userEvent.click(screen.getByRole('button', { name: /logg inn/i }))
}

describe('Passordlas', () => {
  it('slipper inn med riktig passord', async () => {
    const onApnet = vi.fn()
    render(<Passordlas onApnet={onApnet} />)
    await skrivOgSend('Tønsberg!')
    expect(onApnet).toHaveBeenCalledOnce()
  })

  it('avviser feil passord', async () => {
    const onApnet = vi.fn()
    render(<Passordlas onApnet={onApnet} />)
    await skrivOgSend('feil')
    expect(onApnet).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/feil passord/i)
  })

  it('er følsomt for store og små bokstaver', async () => {
    const onApnet = vi.fn()
    render(<Passordlas onApnet={onApnet} />)
    await skrivOgSend('tønsberg!')
    expect(onApnet).not.toHaveBeenCalled()
  })

  it('ser bort fra mellomrom rundt passordet', async () => {
    const onApnet = vi.fn()
    render(<Passordlas onApnet={onApnet} />)
    await skrivOgSend('  Tønsberg!  ')
    expect(onApnet).toHaveBeenCalledOnce()
  })

  it('slår av autoretting slik at mobiltastaturet ikke ødelegger passordet', () => {
    render(<Passordlas onApnet={vi.fn()} />)
    const felt = screen.getByLabelText(/passord/i)
    expect(felt).toHaveAttribute('autocapitalize', 'none')
    expect(felt).toHaveAttribute('autocorrect', 'off')
    expect(felt).toHaveAttribute('spellcheck', 'false')
  })

  it('viser ingen feilmelding før man har prøvd', () => {
    render(<Passordlas onApnet={vi.fn()} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('fjerner feilmeldingen når man skriver på nytt', async () => {
    render(<Passordlas onApnet={vi.fn()} />)
    await skrivOgSend('feil')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/passord/i), 'x')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
