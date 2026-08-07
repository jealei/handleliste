import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Laster } from './Laster'

describe('Laster', () => {
  it('viser synlig tekst, aldri en tom skjerm', () => {
    const { container } = render(<Laster />)
    expect(container.textContent?.trim()).not.toBe('')
  })

  it('nevner appen ved navn så man ser at riktig side er lastet', () => {
    render(<Laster />)
    expect(screen.getByText(/handleliste/i)).toBeInTheDocument()
  })

  it('melder fra til skjermlesere at noe skjer', () => {
    render(<Laster />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
