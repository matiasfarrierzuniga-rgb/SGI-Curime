import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '@/features/auth'
import { ToastProvider } from '@/shared/ui/Toast'
import { ProfilePage } from './ProfilePage'

const authMock = vi.hoisted(() => ({
  user: { fullName: 'Ana Pérez', email: 'ana@test.com', role: 'Usuario', status: 'ACTIVE' },
  changePassword: vi.fn(),
}))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: authMock.user }),
  authService: { changePassword: authMock.changePassword },
}))

const renderPage = () => render(<ToastProvider><ProfilePage /></ToastProvider>)

function fill(confirmation = 'New1234567') {
  fireEvent.change(screen.getByLabelText(/^contraseña actual/i), { target: { value: 'Old1234567' } })
  fireEvent.change(screen.getByLabelText(/^nueva contraseña/i), { target: { value: 'New1234567' } })
  fireEvent.change(screen.getByLabelText(/^confirmar nueva contraseña/i), { target: { value: confirmation } })
}

describe('ProfilePage', () => {
  beforeEach(() => {
    authMock.user = { fullName: 'Ana Pérez', email: 'ana@test.com', role: 'Usuario', status: 'ACTIVE' }
    authMock.changePassword.mockReset()
  })

  it('shows identity header, account data, localized active state, and password fields', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Ana Pérez' })).toBeInTheDocument()
    expect(screen.getByText('AP')).toBeInTheDocument()
    expect(screen.getAllByText('ana@test.com')).toHaveLength(2)
    expect(screen.getByText('Rol: Usuario')).toBeInTheDocument()
    expect(screen.getByText('Usuario', { selector: 'dd' })).toBeInTheDocument()
    expect(screen.getAllByText('Activo')).toHaveLength(2)
    expect([
      screen.getByLabelText(/^contraseña actual/i),
      screen.getByLabelText(/^nueva contraseña/i),
      screen.getByLabelText(/^confirmar nueva contraseña/i),
    ]).toHaveLength(3)
  })

  it('handles incomplete session data without inventing identity values', () => {
    authMock.user = { fullName: '', email: '', role: '', status: '' }
    renderPage()
    expect(screen.getByRole('heading', { name: 'No disponible' })).toBeInTheDocument()
    expect(screen.getAllByText('No disponible').length).toBeGreaterThanOrEqual(4)
    expect(screen.queryByText('Activo')).not.toBeInTheDocument()
  })

  it('validates mismatched password confirmation without contacting the service', () => {
    renderPage()
    fill('Other1234567')
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(screen.getByRole('alert')).toHaveTextContent('no coinciden')
    expect(authService.changePassword).not.toHaveBeenCalled()
  })

  it('toggles each password field independently and keeps values', () => {
    renderPage()
    fill()

    const currentPassword = screen.getByLabelText(/^contraseña actual/i)
    const newPassword = screen.getByLabelText(/^nueva contraseña/i)
    const confirmation = screen.getByLabelText(/^confirmar nueva contraseña/i)

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar la contraseña actual' }))
    expect(currentPassword).toHaveAttribute('type', 'text')
    expect(currentPassword).toHaveValue('Old1234567')
    expect(newPassword).toHaveAttribute('type', 'password')
    expect(confirmation).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar la nueva contraseña' }))
    expect(newPassword).toHaveAttribute('type', 'text')
    expect(confirmation).toHaveAttribute('type', 'password')
  })

  it('sends the backend contract once and clears password values after success', async () => {
    authMock.changePassword.mockResolvedValue({ message: 'Actualizada' })
    renderPage()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    await waitFor(() => expect(authService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'Old1234567',
      newPassword: 'New1234567',
      newPasswordConfirmation: 'New1234567',
    }))
    expect(await screen.findByText('Actualizada')).toBeInTheDocument()
    for (const field of [
      screen.getByLabelText(/^contraseña actual/i),
      screen.getByLabelText(/^nueva contraseña/i),
      screen.getByLabelText(/^confirmar nueva contraseña/i),
    ]) expect(field).toHaveValue('')
    expect(sessionStorage.length).toBe(0)
  })

  it('prevents duplicate submission while request is pending', async () => {
    let resolveRequest!: (value: { message: string }) => void
    authMock.changePassword.mockReturnValue(new Promise(resolve => { resolveRequest = resolve }))
    renderPage()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    const submit = await screen.findByRole('button', { name: /actualizando/i })
    expect(submit).toBeDisabled()
    fireEvent.click(submit)
    expect(authService.changePassword).toHaveBeenCalledTimes(1)

    resolveRequest({ message: 'Actualizada' })
    await waitFor(() => expect(authService.changePassword).toHaveBeenCalledTimes(1))
  })

  it('shows a recoverable service error and preserves entered values', async () => {
    authMock.changePassword.mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { message: 'Actual no válida' } } })
    renderPage()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Actual no válida')
    expect(screen.getByLabelText(/^contraseña actual/i)).toHaveValue('Old1234567')
    expect(screen.getByLabelText(/^nueva contraseña/i)).toHaveValue('New1234567')
  })

  it.each([
    'Current password is incorrect',
    'password must contain an uppercase letter',
    'New password must be different',
  ])('surfaces backend password policy response: %s', async message => {
    authMock.changePassword.mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { message } } })
    renderPage()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
  })
})
