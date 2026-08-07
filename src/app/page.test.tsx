import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { NOKKEL_OPPLAST, erOpplast } from '@/lib/lagring'
import Side from './page'

beforeEach(() => window.localStorage.clear())

/**
 * Testene her dekker sammensetningen av sida — punktet der «svart skjerm»-feilen
 * levde. Komponentene under var testet hver for seg; det som manglet var en test
 * på at sida faktisk kommer seg VIDERE fra lastetilstanden.
 */
describe('Side', () => {
  it('blir aldri stående i lastetilstand', async () => {
    render(<Side />)
    expect(await screen.findByLabelText(/passord/i)).toBeInTheDocument()
    expect(screen.queryByText(/laster/i)).not.toBeInTheDocument()
  })

  it('viser passordskjermen når man ikke er logget inn', async () => {
    render(<Side />)
    expect(await screen.findByRole('button', { name: /logg inn/i })).toBeInTheDocument()
  })

  it('går rett til lista når man allerede er logget inn', async () => {
    window.localStorage.setItem(NOKKEL_OPPLAST, 'ja')
    render(<Side />)
    expect(await screen.findByRole('heading', { name: /Drikkevarer/ })).toBeInTheDocument()
    expect(screen.queryByLabelText(/passord/i)).not.toBeInTheDocument()
  })

  it('slipper inn og husker det etter riktig passord', async () => {
    render(<Side />)
    await userEvent.type(await screen.findByLabelText(/passord/i), 'Tønsberg!')
    await userEvent.click(screen.getByRole('button', { name: /logg inn/i }))

    expect(await screen.findByRole('heading', { name: /Drikkevarer/ })).toBeInTheDocument()
    expect(erOpplast()).toBe(true)
  })

  it('går tilbake til passordskjermen ved utlogging', async () => {
    window.localStorage.setItem(NOKKEL_OPPLAST, 'ja')
    render(<Side />)
    await userEvent.click(await screen.findByRole('button', { name: /logg ut/i }))

    expect(await screen.findByLabelText(/passord/i)).toBeInTheDocument()
    expect(erOpplast()).toBe(false)
  })

  it('viser aldri en tom skjerm', () => {
    const { container } = render(<Side />)
    expect(container.textContent?.trim()).not.toBe('')
  })
})
