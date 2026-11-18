import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { CommunityHomePage } from './CommunityHomePage'

const auth = vi.hoisted(() => ({ user: { displayName: 'Ana Comunidad' } as { displayName?: string } | null }))
vi.mock('@/features/auth', () => ({ useAuth: () => auth }))

function renderPage() {
  return render(<MemoryRouter><CommunityHomePage /></MemoryRouter>)
}

describe('CommunityHomePage', () => {
  it('keeps the reservation request prominent and links to the existing route', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Reservá un espacio/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Solicitar una reserva/i })).toHaveAttribute('href', '/servicios/reservas')
    expect(screen.queryByText(/cuenta comunitaria está activa/i)).not.toBeInTheDocument()
  })

  it('preserves community, volunteering and account destinations', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /Eventos/i })).toHaveAttribute('href', '/eventos')
    expect(screen.getByRole('link', { name: /Voluntariado/i })).toHaveAttribute('href', '/voluntariado')
    expect(screen.getByRole('link', { name: /Mi perfil/i })).toHaveAttribute('href', '/profile')
    expect(screen.queryByRole('link', { name: /ERP|Administración/i })).not.toBeInTheDocument()
  })

  it('uses the actual display name and falls back safely when absent', () => {
    auth.user = { displayName: 'Ana Comunidad' }
    const view = renderPage()
    expect(screen.getByRole('heading', { name: '¡Hola, Ana Comunidad!' })).toBeInTheDocument()
    auth.user = { displayName: '   ' }
    view.rerender(<MemoryRouter><CommunityHomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: '¡Bienvenido a Mi Comunidad!' })).toBeInTheDocument()
  })
})
