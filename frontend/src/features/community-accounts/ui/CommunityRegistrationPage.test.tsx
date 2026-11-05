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
  it('submits normalized public data and shows the email confirmation', async () => {
    vi.mocked(communityAccountsService.register).mockResolvedValue({ message: 'neutral' })
    render(<MemoryRouter><CommunityRegistrationPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/Nombre\(s\)/), { target: { value: ' Ana ' } })
    fireEvent.change(screen.getByLabelText(/Primer apellido/), { target: { value: ' Pérez ' } })
    fireEvent.change(screen.getByLabelText(/Número de identificación/), { target: { value: '123456789' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: ' ANA@EXAMPLE.TEST ' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('heading', { name: 'Confirme su correo electrónico' })).toBeInTheDocument()
    expect(communityAccountsService.register).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Ana', firstSurname: 'Pérez', identification: '123456789', email: 'ana@example.test', privacyAcknowledgement: true }))
    expect(vi.mocked(communityAccountsService.register).mock.calls[0][0]).not.toHaveProperty('password')
    expect(dialog.showResultDialog).toHaveBeenCalledWith({
      icon: 'info', title: 'Solicitud recibida',
      text: 'Si los datos permiten continuar, recibirás instrucciones. Revisá tu correo o solicitá ayuda para recuperar el acceso.',
      confirmButtonText: 'Entendido',
    })
    expect(toast.notify).not.toHaveBeenCalled()
  })
  it('shows identification feedback inline without submitting', () => {
    render(<MemoryRouter><CommunityRegistrationPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/Número de identificación/), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText('Cédula nacional: debe contener exactamente 9 dígitos y no iniciar en 0.')).toBeInTheDocument()
    expect(communityAccountsService.register).not.toHaveBeenCalled()
  })
})
