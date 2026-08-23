import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { authService } from '../api/auth.api'

vi.mock('../api/auth.api', () => ({ authService: { forgotPassword: vi.fn() } }))

const renderPage = () => render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)

describe('ForgotPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the recovery form with required email', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Recuperar contraseña' })).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeRequired()
  })

  it('sends a normalized email and shows the success message', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({ message: 'Instrucciones enviadas' })
    renderPage()
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: '  Ana@Test.CR ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar instrucciones' }))
    await waitFor(() => expect(authService.forgotPassword).toHaveBeenCalledWith('ana@test.cr'))
    expect(await screen.findByText('Instrucciones enviadas')).toBeInTheDocument()
  })

  it('shows a generic error when the service fails', async () => {
    vi.mocked(authService.forgotPassword).mockRejectedValue(new Error('down'))
    renderPage()
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@test.cr' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar instrucciones' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible procesar la solicitud')
  })
})
