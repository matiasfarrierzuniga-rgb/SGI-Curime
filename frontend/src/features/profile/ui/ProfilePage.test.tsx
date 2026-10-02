import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '@/features/auth'
import { ToastProvider } from '@/shared/ui/Toast'
import { ProfilePage } from './ProfilePage'

vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { fullName: 'Ana', email: 'ana@test.com', role: 'Usuario', status: 'ACTIVE' } }), authService: { changePassword: vi.fn() } }))

const renderPage = () => render(<ToastProvider><ProfilePage /></ToastProvider>)

function fill(confirmation = 'New1234567') {
  fireEvent.change(screen.getByLabelText(/^contraseña actual/i), { target: { value: 'Old1234567' } })
  fireEvent.change(screen.getByLabelText(/^nueva contraseña/i), { target: { value: 'New1234567' } })
  fireEvent.change(screen.getByLabelText(/^confirmar nueva contraseña/i), { target: { value: confirmation } })
}

describe('ProfilePage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows account data, localized active state, and password fields', () => {
    renderPage()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('ana@test.com')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getAllByLabelText(/contraseña/i)).toHaveLength(3)
  })

  it('validates mismatched password confirmation', () => {
    renderPage()
    fill('Other1234567')
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(screen.getByRole('alert')).toHaveTextContent('no coinciden')
  })

  it('sends current, new, and confirmation passwords then clears values', async () => {
    vi.mocked(authService.changePassword).mockResolvedValue({ message: 'Actualizada' })
    renderPage()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    await waitFor(() => expect(authService.changePassword).toHaveBeenCalledWith({ currentPassword: 'Old1234567', password: 'New1234567', passwordConfirmation: 'New1234567' }))
    expect(await screen.findByText('Actualizada')).toBeInTheDocument()
    for (const field of screen.getAllByLabelText(/contraseña/i)) expect(field).toHaveValue('')
  })

  it('shows a service error', async () => {
    vi.mocked(authService.changePassword).mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { message: 'Actual no válida' } } })
    renderPage()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Actual no válida')
  })
})
