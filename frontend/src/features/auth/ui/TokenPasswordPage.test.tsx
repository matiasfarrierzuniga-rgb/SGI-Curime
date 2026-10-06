import axios from 'axios'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../api/auth.api'
import { TokenPasswordPage } from './TokenPasswordPage'

vi.mock('../api/auth.api', () => ({ authService: { activate: vi.fn(), resetPassword: vi.fn() } }))

function renderAt(mode: 'activate' | 'reset', token = 'abc123') {
  return render(<MemoryRouter initialEntries={[`/token${token ? `?token=${token}` : ''}`]}><TokenPasswordPage mode={mode} /></MemoryRouter>)
}

function fill(password = 'Secure12345', confirmation = password) {
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: confirmation } })
}

function activationError(message: string, status = 400) {
  return new axios.AxiosError('Request failed', String(status), undefined, undefined, {
    status,
    statusText: 'Error',
    headers: {},
    config: {} as never,
    data: { message },
  })
}

describe('TokenPasswordPage activation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows missing-token feedback without attempting activation', () => {
    renderAt('activate', '')
    expect(screen.getByRole('alert')).toHaveTextContent('Falta el token de activación')
    expect(screen.getByRole('button', { name: 'Activar cuenta' })).toBeDisabled()
    expect(authService.activate).not.toHaveBeenCalled()
  })

  it.each([
    ['Invalid activation token', 400, 'no es válido o venció'],
    ['Activation token has expired', 400, 'no es válido o venció'],
    ['Activation token has already been used', 409, 'ya fue utilizado'],
    ['Account cannot be activated', 409, 'no es elegible para activarse o ya está activa'],
    ['password must contain uppercase, lowercase and number', 400, 'no cumple la política requerida'],
  ])('maps authoritative backend outcome: %s', async (message, status, feedback) => {
    vi.mocked(authService.activate).mockRejectedValue(activationError(message, status))
    renderAt('activate')
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(feedback)
    expect(authService.activate).toHaveBeenCalledTimes(1)
  })

  it('shows a mismatched-password outcome without contacting the server', async () => {
    renderAt('activate')
    fill('Secure12345', 'Other123456')
    fireEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('contraseñas no coinciden')
    expect(authService.activate).not.toHaveBeenCalled()
  })

  it('clears passwords, offers login, creates no session, and permits no replay after success', async () => {
    vi.mocked(authService.activate).mockResolvedValue({ message: 'Account activated successfully' })
    renderAt('activate')
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }))

    expect(await screen.findByText('Cuenta activada correctamente. Ya puede iniciar sesión.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nueva contraseña')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(authService.activate).toHaveBeenCalledTimes(1)
    expect(localStorage).toHaveLength(0)
    expect(sessionStorage).toHaveLength(0)
  })

  it('keeps the form available for a safe retry after backend failure', async () => {
    vi.mocked(authService.activate)
      .mockRejectedValueOnce(activationError('Activation token is no longer valid', 409))
      .mockResolvedValueOnce({ message: 'Account activated successfully' })
    renderAt('activate')
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('no es válido o venció')

    fireEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }))
    await waitFor(() => expect(authService.activate).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Cuenta activada correctamente. Ya puede iniciar sesión.')).toBeInTheDocument()
  })
})
