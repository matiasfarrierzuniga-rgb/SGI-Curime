import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePublicVenture } from '../hooks/usePublicVentures'
import { PublicVentureDetailPage } from './PublicVentureDetailPage'

vi.mock('../hooks/usePublicVentures', () => ({ usePublicVenture: vi.fn() }))

function renderPage(path = '/ventures/7') {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/ventures/:id" element={<PublicVentureDetailPage />} /></Routes></MemoryRouter>)
}

describe('PublicVentureDetailPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders public contact fields and safe external links', () => {
    vi.mocked(usePublicVenture).mockReturnValue({ isPending: false, isError: false, data: { id: 7, name: 'Café Curime', description: 'Café de producción local.', offerDescription: 'Bebidas y repostería.', businessPhone: '+506 8888-1234', businessEmail: 'hola@cafecurime.cr', websiteUrl: 'https://cafecurime.cr', socialUrl: 'https://facebook.com/cafecurime', locationText: 'Curime, Nicoya' } } as never)

    renderPage()

    expect(screen.getByRole('heading', { name: 'Café Curime' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'hola@cafecurime.cr' })).toHaveAttribute('href', 'mailto:hola@cafecurime.cr')
    expect(screen.getByRole('link', { name: /volver a emprendimientos/i })).toHaveAttribute('href', '/ventures')
  })

  it('does not request data for a non-numeric route id', () => {
    vi.mocked(usePublicVenture).mockReturnValue({ isPending: false, isError: false } as never)

    renderPage('/ventures/no-es-numero')

    expect(usePublicVenture).toHaveBeenCalledWith(null)
    expect(screen.getByRole('alert')).toHaveTextContent('Emprendimiento no disponible')
  })
})
