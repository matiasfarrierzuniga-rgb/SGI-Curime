import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForbiddenPage } from './ForbiddenPage'
import { NotFoundPage } from './NotFoundPage'

const auth = vi.hoisted(() => ({ user: null as null | { canAccessErp: boolean; permissionCodes: string[] } }))
vi.mock('@/features/auth', () => ({ useAuth: () => auth }))

describe('status pages', () => {
  beforeEach(() => { auth.user = null })

  it('offers ERP navigation only when backend-authoritative access allows it', () => {
    auth.user = { canAccessErp: true, permissionCodes: [] }
    render(<MemoryRouter><ForbiddenPage /></MemoryRouter>)
    expect(screen.getByText('Acceso no autorizado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir al ERP' })).toHaveAttribute('href', '/app')
  })

  it('does not infer ERP access from assigned permissions', () => {
    auth.user = { canAccessErp: false, permissionCodes: ['usr.users.read'] }
    render(<MemoryRouter><ForbiddenPage /></MemoryRouter>)
    expect(screen.queryByRole('link', { name: 'Ir al ERP' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Tienes acceso al ERP/)).not.toBeInTheDocument()
  })

  it('renders useful 404 navigation', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/')
  })
})
