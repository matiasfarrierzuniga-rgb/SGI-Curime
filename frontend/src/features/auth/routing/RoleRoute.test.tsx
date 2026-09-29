import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RoleRoute } from './RoleRoute'

const auth = vi.hoisted(() => ({
  user: { permissionCodes: [] as string[], canAccessErp: true } as { permissionCodes: string[]; canAccessErp: boolean } | null,
  isAuthenticated: true,
}))

vi.mock('../model/AuthContext', () => ({
  useAuth: () => auth,
}))

function Location() {
  return <p>{useLocation().pathname}</p>
}

function renderRoute(props: React.ComponentProps<typeof RoleRoute>) {
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<RoleRoute {...props} />}>
          <Route path="/protected" element={<p>Permitido</p>} />
        </Route>
        <Route path="/403" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoleRoute', () => {
  it('redirects unauthenticated capability routes to /403', () => {
    auth.user = null
    auth.isAuthenticated = false

    renderRoute({ capability: 'usr.users.read' })

    expect(screen.queryByText('Permitido')).not.toBeInTheDocument()
    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('renders capability route for administrator usr.users.read', () => {
    auth.user = { permissionCodes: ['usr.users.read'], canAccessErp: true }
    auth.isAuthenticated = true

    renderRoute({ capability: 'usr.users.read' })

    expect(screen.getByText('Permitido')).toBeInTheDocument()
  })

  it('renders reservation administration route for administrator capability', () => {
    auth.user = { permissionCodes: ['res.reservations.read'], canAccessErp: true }
    auth.isAuthenticated = true

    renderRoute({ capability: 'res.reservations.read' })

    expect(screen.getByText('Permitido')).toBeInTheDocument()
  })

  it('denies reservation administration route without reservation capability', () => {
    auth.user = { permissionCodes: [], canAccessErp: true }
    auth.isAuthenticated = true

    renderRoute({ capability: 'res.reservations.read' })

    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('redirects inventory manager from usr.users.read', () => {
    auth.user = { permissionCodes: [], canAccessErp: true }
    auth.isAuthenticated = true

    renderRoute({ capability: 'usr.users.read' })

    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('redirects user without required capability from privileged route', () => {
    auth.user = { permissionCodes: [], canAccessErp: true }
    auth.isAuthenticated = true

    renderRoute({ capability: 'usr.users.read' })

    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('redirects unknown capability', () => {
    auth.user = { permissionCodes: ['usr.users.read'], canAccessErp: true }
    auth.isAuthenticated = true

    renderRoute({ capability: 'unknown.capability' })

    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('denies capability absent from permission codes', () => {
    auth.user = { permissionCodes: ['usr.users.read'], canAccessErp: true }
    auth.isAuthenticated = true

    renderRoute({ capability: 'unknown.capability' })

    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('allows routes without a capability requirement', () => {
    auth.user = { permissionCodes: [], canAccessErp: true }
    auth.isAuthenticated = true

    renderRoute({})

    expect(screen.getByText('Permitido')).toBeInTheDocument()
  })
})
