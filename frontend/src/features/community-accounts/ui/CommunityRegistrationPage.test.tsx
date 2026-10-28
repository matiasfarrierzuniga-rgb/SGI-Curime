import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { communityAccountsService } from '../api/communityAccounts.api'
import { CommunityRegistrationPage } from './CommunityRegistrationPage'

vi.mock('../api/communityAccounts.api', () => ({ communityAccountsService: { register: vi.fn(), verifyEmail: vi.fn(), resendVerification: vi.fn() } }))
const toast = vi.hoisted(() => ({ notify: vi.fn() }))
vi.mock('@/shared/ui/Toast', () => ({ useToast: () => toast }))
const dialog = vi.hoisted(() => ({ showResultDialog: vi.fn() }))
vi.mock('@/shared/ui/resultDialog', () => dialog)

describe('CommunityRegistrationPage', () => {
  beforeEach(() => { vi.clearAllMocks(); dialog.showResultDialog.mockResolvedValue({ isConfirmed: true }) })
  it('requires minimum fields and privacy acknowledgement', () => {
    render(<MemoryRouter><CommunityRegistrationPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText('Debe aceptar el uso de sus datos para crear la cuenta.')).toBeInTheDocument()
  })
  it('submits normalized public data and shows neutral confirmation', async () => {
    vi.mocked(communityAccountsService.register).mockResolvedValue({ message: 'neutral' })
    render(<MemoryRouter><CommunityRegistrationPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: ' Ana Pérez ' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: ' ANA@EXAMPLE.TEST ' } })
    fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: 'Password123' } })
    fireEvent.change(screen.getByLabelText(/^Confirmar contraseña/), { target: { value: 'Password123' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('heading', { name: 'Confirme su correo electrónico' })).toBeInTheDocument()
    expect(communityAccountsService.register).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Ana Pérez', email: 'ana@example.test', privacyAcknowledgement: true }))
    expect(dialog.showResultDialog).toHaveBeenCalledWith({
      icon: 'info', title: 'Solicitud recibida',
      text: 'Si el correo puede utilizarse, recibirás un enlace para verificar tu cuenta',
      confirmButtonText: 'Entendido',
    })
    expect(toast.notify).not.toHaveBeenCalled()
  })
  it('shows uppercase password feedback inline without submitting', () => {
    render(<MemoryRouter><CommunityRegistrationPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText('La contraseña debe incluir al menos una letra mayúscula')).toBeInTheDocument()
    expect(communityAccountsService.register).not.toHaveBeenCalled()
  })
})
