import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ROLE_ADMIN, ROLE_INVENTORY_MANAGER } from '../../../shared/security/roles'
import { RoleRoute } from './RoleRoute'

const auth = vi.hoisted(() => ({
  user: { role: 'Administrador' } as { role: string } | null,
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
  it('redirects unauthenticated legacy roles to /403', () => {
    auth.user = null
    auth.isAuthenticated = false

    renderRoute({ role: ROLE_ADMIN })

    expect(screen.queryByText('Permitido')).not.toBeInTheDocument()
    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('renders capability route for administrator usr.users.read', () => {
    auth.user = { role: ROLE_ADMIN }
    auth.isAuthenticated = true

    renderRoute({ capability: 'usr.users.read' })

    expect(screen.getByText('Permitido')).toBeInTheDocument()
  })

  it('redirects inventory manager from usr.users.read', () => {
    auth.user = { role: ROLE_INVENTORY_MANAGER }
    auth.isAuthenticated = true

    renderRoute({ capability: 'usr.users.read' })

    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('redirects unknown role from privileged route', () => {
    auth.user = { role: 'Rol desconocido' }
    auth.isAuthenticated = true

    renderRoute({ role: ROLE_ADMIN })

    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('redirects unknown capability', () => {
    auth.user = { role: ROLE_ADMIN }
    auth.isAuthenticated = true

    renderRoute({ capability: 'unknown.capability' })

    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('prioritizes denied capability over allowed legacy role', () => {
    auth.user = { role: ROLE_ADMIN }
    auth.isAuthenticated = true

    renderRoute({ role: ROLE_ADMIN, capability: 'unknown.capability' })

    expect(screen.getByText('/403')).toBeInTheDocument()
  })

  it('allows legacy role arrays', () => {
    auth.user = { role: ROLE_INVENTORY_MANAGER }
    auth.isAuthenticated = true

    renderRoute({ role: [ROLE_ADMIN, ROLE_INVENTORY_MANAGER] })

    expect(screen.getByText('Permitido')).toBeInTheDocument()
  })
})
