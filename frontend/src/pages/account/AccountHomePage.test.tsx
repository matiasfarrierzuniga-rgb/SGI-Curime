import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AccountHomePage } from './AccountHomePage'

vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { fullName: 'Ana Pérez', role: 'Usuario' } }) }))

describe('AccountHomePage', () => {
  it('shows personal account information without ERP content', () => {
    render(<MemoryRouter><AccountHomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
    expect(screen.getByText('Usuario')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mi perfil/ })).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('link', { name: /Ver sitio público/ })).toHaveAttribute('href', '/')
    expect(screen.queryByText('Área de gestión')).not.toBeInTheDocument()
    expect(screen.queryByText('Inventario')).not.toBeInTheDocument()
  })
})
