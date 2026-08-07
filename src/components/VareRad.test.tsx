import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VareRad } from './VareRad'

const vare = {
  id: 'drikkevarer-eplejuice-eldorado',
  vare: 'Eplejuice',
  merke: 'Eldorado',
  borHa: '5',
  forpakning: '1,75l',
  kommentar: 'Fersk',
}

describe('VareRad', () => {
  it('viser varenavn, merke, forpakning og kommentar', () => {
    render(<VareRad vare={vare} antall={0} onEndre={vi.fn()} />)
    expect(screen.getByText('Eplejuice')).toBeInTheDocument()
    expect(screen.getByText(/Eldorado/)).toBeInTheDocument()
    expect(screen.getByText(/1,75l/)).toBeInTheDocument()
    expect(screen.getByText('Fersk')).toBeInTheDocument()
    expect(screen.getByText(/Bør ha 5/)).toBeInTheDocument()
  })

  it('viser bare varenavnet når resten mangler', () => {
    render(<VareRad vare={{ id: 'x', vare: 'Sylte' }} antall={0} onEndre={vi.fn()} />)
    expect(screen.getByText('Sylte')).toBeInTheDocument()
    expect(screen.queryByText(/Bør ha/)).not.toBeInTheDocument()
  })

  it('deaktiverer minusknappen på null', () => {
    render(<VareRad vare={vare} antall={0} onEndre={vi.fn()} />)
    expect(screen.getByRole('button', { name: /færre/i })).toBeDisabled()
  })

  it('aktiverer minusknappen over null', () => {
    render(<VareRad vare={vare} antall={1} onEndre={vi.fn()} />)
    expect(screen.getByRole('button', { name: /færre/i })).toBeEnabled()
  })

  it('øker med én', async () => {
    const onEndre = vi.fn()
    render(<VareRad vare={vare} antall={2} onEndre={onEndre} />)
    await userEvent.click(screen.getByRole('button', { name: /flere/i }))
    expect(onEndre).toHaveBeenCalledWith(vare.id, 3)
  })

  it('reduserer med én', async () => {
    const onEndre = vi.fn()
    render(<VareRad vare={vare} antall={2} onEndre={onEndre} />)
    await userEvent.click(screen.getByRole('button', { name: /færre/i }))
    expect(onEndre).toHaveBeenCalledWith(vare.id, 1)
  })

  it('tolker skrevet tall', async () => {
    const onEndre = vi.fn()
    render(<VareRad vare={vare} antall={0} onEndre={onEndre} />)
    await userEvent.type(screen.getByRole('textbox', { name: /antall/i }), '7')
    expect(onEndre).toHaveBeenCalledWith(vare.id, 7)
  })

  it('gir null — ikke NaN — når feltet tømmes', async () => {
    const onEndre = vi.fn()
    render(<VareRad vare={vare} antall={5} onEndre={onEndre} />)
    await userEvent.clear(screen.getByRole('textbox', { name: /antall/i }))
    expect(onEndre).toHaveBeenCalledWith(vare.id, 0)
    expect(onEndre.mock.calls.every(([, n]) => !Number.isNaN(n))).toBe(true)
  })

  it('ser bort fra bokstaver i feltet', async () => {
    const onEndre = vi.fn()
    render(<VareRad vare={vare} antall={0} onEndre={onEndre} />)
    await userEvent.type(screen.getByRole('textbox', { name: /antall/i }), 'a')
    expect(onEndre).toHaveBeenCalledWith(vare.id, 0)
  })

  it('merker raden når noe er valgt', () => {
    const { rerender } = render(<VareRad vare={vare} antall={0} onEndre={vi.fn()} />)
    expect(screen.getByRole('listitem')).toHaveAttribute('data-valgt', 'false')
    rerender(<VareRad vare={vare} antall={2} onEndre={vi.fn()} />)
    expect(screen.getByRole('listitem')).toHaveAttribute('data-valgt', 'true')
  })
})
