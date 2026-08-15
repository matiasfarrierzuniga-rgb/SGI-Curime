import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'
const state = vi.hoisted(() => ({ value: { isLoading: false, isAuthenticated: false } }))
vi.mock('./AuthContext', () => ({ useAuth: () => state.value }))
function Login() { const l = useLocation(); return <p>Login from {(l.state as any)?.from?.pathname}</p> }
describe('ProtectedRoute', () => {
  it('does not expose protected content while restoring', () => { state.value = { isLoading: true, isAuthenticated: false }; render(<MemoryRouter initialEntries={['/private']}><Routes><Route element={<ProtectedRoute/>}><Route path="/private" element={<p>Secret</p>}/></Route></Routes></MemoryRouter>); expect(screen.queryByText('Secret')).not.toBeInTheDocument(); expect(screen.getByText(/Restaurando sesión/)).toBeInTheDocument() })
  it('allows authenticated users', () => { state.value = { isLoading: false, isAuthenticated: true }; render(<MemoryRouter initialEntries={['/private']}><Routes><Route element={<ProtectedRoute/>}><Route path="/private" element={<p>Secret</p>}/></Route></Routes></MemoryRouter>); expect(screen.getByText('Secret')).toBeInTheDocument() })
  it('redirects unauthenticated users and preserves their requested route', () => { state.value = { isLoading: false, isAuthenticated: false }; render(<MemoryRouter initialEntries={['/private']}><Routes><Route path="/login" element={<Login/>}/><Route element={<ProtectedRoute/>}><Route path="/private" element={<p>Secret</p>}/></Route></Routes></MemoryRouter>); expect(screen.getByText('Login from /private')).toBeInTheDocument() })
})
