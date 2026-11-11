import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/shared/ui/Toast'
import { ProfilePage } from './ProfilePage'

const changePassword = vi.fn()
const logout = vi.fn()
vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { fullName: 'Ana', email: 'ana@test.com', role: 'ROLE_SYSTEM_ADMIN', status: 'ACTIVE' }, changePassword, logout }) }))

const renderPage = () => render(<MemoryRouter initialEntries={['/profile']}><ToastProvider><Routes><Route path="/profile" element={<ProfilePage />} /><Route path="/login" element={<p>Iniciar sesión</p>} /></Routes></ToastProvider></MemoryRouter>)

function fill(confirmation = 'New1234567') {
  fireEvent.change(screen.getByLabelText(/^contraseña actual/i), { target: { value: 'Old1234567' } })
  fireEvent.change(screen.getByLabelText(/^nueva contraseña/i), { target: { value: 'New1234567' } })
  fireEvent.change(screen.getByLabelText(/^confirmar nueva contraseña/i), { target: { value: confirmation } })
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    changePassword.mockResolvedValue({ message: 'Actualizada' })
  })

  it('shows account data, localized active state, and password fields', () => {
    renderPage()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('ana@test.com')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Administrador del sistema')).toBeInTheDocument()
    expect(screen.queryByText('ROLE_SYSTEM_ADMIN')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText(/contraseña/i)).toHaveLength(3)
  })

  it('validates mismatched password confirmation', () => {
    renderPage()
    fill('Other1234567')
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(screen.getByRole('alert')).toHaveTextContent('no coinciden')
  })

  it('sends current, new, and confirmation passwords then clears values', async () => {
    renderPage()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith({ currentPassword: 'Old1234567', newPassword: 'New1234567', newPasswordConfirmation: 'New1234567' }))
    expect(await screen.findByText('Actualizada')).toBeInTheDocument()
    expect(logout).not.toHaveBeenCalled()
    expect(await screen.findByText('Iniciar sesión')).toBeInTheDocument()
  })

  it('shows a service error', async () => {
    changePassword.mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { message: 'Actual no válida' } } })
    renderPage()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Actual no válida')
  })
})
