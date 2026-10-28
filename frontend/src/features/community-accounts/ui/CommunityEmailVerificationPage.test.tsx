import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { communityAccountsService } from '../api/communityAccounts.api'
import { CommunityEmailVerificationPage } from './CommunityEmailVerificationPage'

const toast = vi.hoisted(() => ({ notify: vi.fn() }))
vi.mock('@/shared/ui/Toast', () => ({ useToast: () => toast }))
vi.mock('../api/communityAccounts.api', () => ({ communityAccountsService: { verifyEmail: vi.fn(), resendVerification: vi.fn() } }))
const dialog = vi.hoisted(() => ({ showResultDialog: vi.fn() }))
vi.mock('@/shared/ui/resultDialog', () => dialog)

function renderPage(entry = '/verify-community-email?token=valid-token', strict = false) {
  const routes = <MemoryRouter initialEntries={[entry]}><Routes><Route path="/verify-community-email" element={<CommunityEmailVerificationPage />} /><Route path="/login" element={<p>Login target</p>} /></Routes></MemoryRouter>
  return render(strict ? <StrictMode>{routes}</StrictMode> : routes)
}

describe('CommunityEmailVerificationPage', () => {
  beforeEach(() => { vi.clearAllMocks(); dialog.showResultDialog.mockResolvedValue({ isConfirmed: true }) })

  it('shows a success dialog and sends its primary action to login', async () => {
    vi.mocked(communityAccountsService.verifyEmail).mockResolvedValue({ message: 'ignored' })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Verificar correo' }))
    expect(await screen.findByText('Login target')).toBeInTheDocument()
    expect(dialog.showResultDialog).toHaveBeenCalledWith({
      icon: 'success', title: '¡Correo verificado!',
      text: 'Tu cuenta comunitaria está activa. Ya podés iniciar sesión',
      confirmButtonText: 'Iniciar sesión',
    })
    expect(toast.notify).not.toHaveBeenCalled()
    expect(communityAccountsService.verifyEmail).toHaveBeenCalledTimes(1)
    expect(dialog.showResultDialog).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('sgi-curime-session')).toBeNull()
  })

  it('allows only one effective operation after a double click', async () => {
    let resolve!: (value: { message: string }) => void
    vi.mocked(communityAccountsService.verifyEmail).mockReturnValue(new Promise((done) => { resolve = done }))
    renderPage()
    const button = screen.getByRole('button', { name: 'Verificar correo' })
    act(() => {
      fireEvent.click(button)
      fireEvent.click(button)
    })
    expect(communityAccountsService.verifyEmail).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()
    resolve({ message: 'verified' })
    expect(await screen.findByText('Login target')).toBeInTheDocument()
    expect(dialog.showResultDialog).toHaveBeenCalledTimes(1)
  })

  it('does not verify on StrictMode mount and submits once after explicit action', async () => {
    vi.mocked(communityAccountsService.verifyEmail).mockResolvedValue({ message: 'verified' })
    renderPage('/verify-community-email?token=strict-token', true)
    expect(communityAccountsService.verifyEmail).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Verificar correo' }))
    expect(await screen.findByText('Login target')).toBeInTheDocument()
    expect(communityAccountsService.verifyEmail).toHaveBeenCalledTimes(1)
  })

  it('shows used-token guidance for a real 409 and does not open success', async () => {
    vi.mocked(communityAccountsService.verifyEmail).mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'El enlace de verificación ya no está disponible.' } } })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Verificar correo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Este enlace ya no es válido. Podés solicitar uno nuevo')
    expect(dialog.showResultDialog).not.toHaveBeenCalled()
  })

  it('shows expired token guidance as persistent page state', async () => {
    vi.mocked(communityAccountsService.verifyEmail).mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'El enlace de verificación venció.' } } })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Verificar correo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace venció. Solicitá uno nuevo para continuar')
  })

  it('shows missing-token guidance without calling the backend', () => {
    renderPage('/verify-community-email')
    expect(screen.getByRole('alert')).toHaveTextContent('Este enlace ya no es válido. Podés solicitar uno nuevo')
    expect(screen.getByRole('button', { name: 'Verificar correo' })).toBeDisabled()
    expect(communityAccountsService.verifyEmail).not.toHaveBeenCalled()
  })

  it('uses info for neutral resend acknowledgement and warning for throttling', async () => {
    vi.mocked(communityAccountsService.resendVerification).mockResolvedValueOnce({ message: 'ignored' }).mockRejectedValueOnce({ isAxiosError: true, response: { status: 429, data: {} } })
    renderPage()
    const email = screen.getByLabelText('Correo electrónico')
    fireEvent.change(email, { target: { value: 'qa@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar enlace' }))
    await waitFor(() => expect(toast.notify).toHaveBeenCalledWith('Solicitud recibida. Si corresponde, recibirás un nuevo enlace', 'info'))
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar enlace' }))
    await waitFor(() => expect(toast.notify).toHaveBeenCalledWith('Realizaste demasiados intentos. Esperá unos minutos antes de continuar', 'warning'))
  })
})
