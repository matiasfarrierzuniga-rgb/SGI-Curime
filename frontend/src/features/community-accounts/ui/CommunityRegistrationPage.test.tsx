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
  it('requires only a valid email address', () => {
    render(<MemoryRouter><CommunityRegistrationPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText('Correo electrónico inválido.')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Nombre/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/identificación/i)).not.toBeInTheDocument()
  })
  it('submits normalized public data and shows the email confirmation', async () => {
    vi.mocked(communityAccountsService.register).mockResolvedValue({ message: 'neutral' })
    render(<MemoryRouter><CommunityRegistrationPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: ' ANA@EXAMPLE.TEST ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('heading', { name: 'Revisá tu correo electrónico' })).toBeInTheDocument()
    expect(communityAccountsService.register).toHaveBeenCalledWith({ email: 'ana@example.test' })
    expect(vi.mocked(communityAccountsService.register).mock.calls[0][0]).not.toHaveProperty('password')
    expect(dialog.showResultDialog).toHaveBeenCalledWith({
      icon: 'info', title: 'Revisá tu correo',
      text: 'Si el correo puede continuar el proceso, recibirás instrucciones para verificar tu cuenta. Este registro no crea afiliación ni acceso administrativo.',
      confirmButtonText: 'Entendido',
    })
    expect(toast.notify).not.toHaveBeenCalled()
  })
  it('shows email feedback inline without submitting', () => {
    render(<MemoryRouter><CommunityRegistrationPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'invalid' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText('Correo electrónico inválido.')).toBeInTheDocument()
    expect(communityAccountsService.register).not.toHaveBeenCalled()
  })
})
