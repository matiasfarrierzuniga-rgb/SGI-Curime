import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { InternalErpRoute } from './InternalErpRoute'

const state = vi.hoisted(() => ({ value: { isLoading: false, isAuthenticated: true, user: { canAccessErp: true, permissionCodes: [] as string[] } } }))
vi.mock('../model/AuthContext', () => ({ useAuth: () => state.value }))

function renderRoute(path = '/app/deep') {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/login" element={<p>Login</p>} /><Route path="/servicios" element={<p>Servicios</p>} /><Route element={<InternalErpRoute />}><Route path="/app/*" element={<p>Interno</p>} /></Route></Routes></MemoryRouter>)
}

describe('InternalErpRoute', () => {
  it('redirects an authenticated user without ERP access outside the shell', () => {
    state.value = { isLoading: false, isAuthenticated: true, user: { canAccessErp: false, permissionCodes: ['erp.dashboard.read'] } }
    renderRoute()
    expect(screen.getByText('Servicios')).toBeInTheDocument()
    expect(screen.queryByText('Interno')).not.toBeInTheDocument()
  })

  it('does not render internal content while restoring the session', () => {
    state.value = { isLoading: true, isAuthenticated: true, user: { canAccessErp: true, permissionCodes: [] } }
    renderRoute('/app')
    expect(screen.queryByText('Interno')).not.toBeInTheDocument()
    expect(screen.getByText(/Restaurando sesión/)).toBeInTheDocument()
  })

  it('sends an anonymous actor to login', () => {
    state.value = { isLoading: false, isAuthenticated: false, user: { canAccessErp: false, permissionCodes: [] } }
    renderRoute()
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.queryByText('Interno')).not.toBeInTheDocument()
  })

  it('allows a current valid affiliate session without administrative capabilities', () => {
    state.value = { isLoading: false, isAuthenticated: true, user: { canAccessErp: true, permissionCodes: [] } }
    renderRoute('/app')
    expect(screen.getByText('Interno')).toBeInTheDocument()
  })
})
