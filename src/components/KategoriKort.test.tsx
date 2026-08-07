import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Kategori } from '@/data/handleliste'
import { KategoriKort } from './KategoriKort'

const kategori: Kategori = {
  id: 'godis',
  navn: 'Godis',
  varer: [
    { id: 'godis-twist', vare: 'Twist', borHa: '2-3' },
    { id: 'godis-mandler', vare: 'Mandler' },
  ],
}

describe('KategoriKort', () => {
  it('viser kategorinavnet', () => {
    render(<KategoriKort kategori={kategori} kjop={{}} onEndre={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Godis' })).toBeInTheDocument()
  })

  it('viser alle varene', () => {
    render(<KategoriKort kategori={kategori} kjop={{}} onEndre={vi.fn()} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('viser ikke antallsmerke når ingenting er valgt', () => {
    render(<KategoriKort kategori={kategori} kjop={{}} onEndre={vi.fn()} />)
    expect(screen.queryByTestId('antall-merke')).not.toBeInTheDocument()
  })

  it('viser antall valgte varer i kategorien', () => {
    render(<KategoriKort kategori={kategori} kjop={{ 'godis-twist': 3 }} onEndre={vi.fn()} />)
    expect(screen.getByTestId('antall-merke')).toHaveTextContent('1')
  })

  it('sender antallet videre til hver rad', () => {
    render(<KategoriKort kategori={kategori} kjop={{ 'godis-twist': 3 }} onEndre={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: /Antall Twist/i })).toHaveValue('3')
    expect(screen.getByRole('textbox', { name: /Antall Mandler/i })).toHaveValue('0')
  })
})
