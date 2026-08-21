import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NOKKEL_KJOP, lesKjop } from '@/lib/lagring'
import { Handleliste } from './Handleliste'

beforeEach(() => window.localStorage.clear())

describe('Handleliste', () => {
  it('viser alle kategoriene', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: 'Drikkevarer' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Varmmat' })).toBeInTheDocument()
  })

  it('laster lagrede verdier fra localStorage', async () => {
    window.localStorage.setItem(
      NOKKEL_KJOP,
      JSON.stringify({ 'drikkevarer-eplejuice-sunniva': 4 }),
    )
    render(<Handleliste onLoggUt={vi.fn()} />)
    const felt = await screen.findByRole('textbox', { name: /Antall Eplejuice/i })
    expect(felt).toHaveValue('4')
  })

  it('overskriver ikke lagrede verdier ved oppstart', async () => {
    window.localStorage.setItem(NOKKEL_KJOP, JSON.stringify({ 'godis-twist': 2 }))
    render(<Handleliste onLoggUt={vi.fn()} />)
    await screen.findByRole('heading', { name: /Godis/ })
    expect(lesKjop()).toEqual({ 'godis-twist': 2 })
  })

  it('lagrer når antallet endres', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    const knapp = await screen.findByRole('button', { name: /Flere Eplejuice/i })
    await userEvent.click(knapp)
    expect(lesKjop()).toEqual({ 'drikkevarer-eplejuice-sunniva': 1 })
  })

  it('oppdaterer antallet i verktøylinja', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: /Flere Eplejuice/i }))
    expect(screen.getByText('1 valgt')).toBeInTheDocument()
  })

  it('viser bare valgte varer i handletur-modus', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: /Flere Eplejuice/i }))
    await userEvent.click(screen.getByRole('switch', { name: /handletur/i }))

    expect(screen.getByRole('heading', { name: /Drikkevarer/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Varmmat/ })).not.toBeInTheDocument()
    const drikke = screen.getByRole('heading', { name: /Drikkevarer/ }).closest('section')!
    expect(within(drikke).getAllByRole('listitem')).toHaveLength(1)
  })

  it('viser en forklaring når handletur-modus er tom', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    await screen.findByRole('heading', { name: 'Drikkevarer' })
    await userEvent.click(screen.getByRole('switch', { name: /handletur/i }))
    expect(screen.getByText(/ikke valgt noe/i)).toBeInTheDocument()
  })

  it('nullstiller etter to trykk', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: /Flere Eplejuice/i }))
    await userEvent.click(screen.getByRole('button', { name: /nullstill/i }))
    await userEvent.click(screen.getByRole('button', { name: /sikker/i }))

    expect(lesKjop()).toEqual({})
    expect(screen.getByRole('textbox', { name: /Antall Eplejuice/i })).toHaveValue('0')
  })

  it('lar ikke antallet bli negativt', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    const minus = await screen.findByRole('button', { name: /Færre Eplejuice/i })
    expect(minus).toBeDisabled()
    expect(lesKjop()).toEqual({})
  })
})
