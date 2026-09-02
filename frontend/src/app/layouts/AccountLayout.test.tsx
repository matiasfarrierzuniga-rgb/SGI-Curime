import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountLayout } from './AccountLayout'

const auth = vi.hoisted(() => ({ user: { fullName: 'Ana Pérez', role: 'Usuario' }, logout: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => auth }))

function renderLayout() {
  return render(<MemoryRouter initialEntries={['/mi-cuenta']}><Routes><Route element={<AccountLayout />}><Route path="/mi-cuenta" element={<h1>Hola, Ana</h1>} /></Route><Route path="/login" element={<h1>Iniciar sesión</h1>} /></Routes></MemoryRouter>)
}

describe('AccountLayout', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders only the minimal personal navigation and public access', () => {
    renderLayout()
    expect(screen.getByRole('navigation', { name: 'Navegación de Mi cuenta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/mi-cuenta')
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('link', { name: 'Ver sitio público' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    expect(screen.queryByText('Área de gestión')).not.toBeInTheDocument()
    expect(screen.queryByText('Inventario')).not.toBeInTheDocument()
  })

  it('closes the session and returns to login', () => {
    renderLayout()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(auth.logout).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
