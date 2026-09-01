import axios from 'axios'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../api/auth.api'
import { RegisterPage } from './RegisterPage'

vi.mock('../api/auth.api', () => ({ authService: { register: vi.fn() } }))

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Ana María' } })
  fireEvent.change(screen.getByLabelText(/Número de identificación/), { target: { value: '123456789' } })
  fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: ' ANA@EXAMPLE.COM ' } })
  fireEvent.change(screen.getByLabelText(/^Contraseña$/), { target: { value: 'Secure12345' } })
  fireEvent.change(screen.getByLabelText(/Confirmar contraseña/), { target: { value: 'Secure12345' } })
}

describe('direct RegisterPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('submits normalized account data without tokens or automatic login', async () => {
    vi.mocked(authService.register).mockResolvedValue({} as never)
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => expect(authService.register).toHaveBeenCalledWith({
      fullName: 'Ana María',
      identificationType: 'NATIONAL',
      identification: '123456789',
      email: 'ana@example.com',
      phoneCountryCode: undefined,
      phoneNationalNumber: undefined,
      address: undefined,
      password: 'Secure12345',
    }))
    expect(await screen.findByText(/Ya puede iniciar sesión/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(localStorage).toHaveLength(0)
  })

  it('blocks passwords that do not satisfy the strong policy', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillValidForm()
    fireEvent.change(screen.getByLabelText(/^Contraseña$/), { target: { value: 'weakpassword' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getAllByRole('alert').some((alert) => alert.textContent?.includes('mayúscula'))).toBe(true)
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows duplicate-email feedback from a 400 response', async () => {
    vi.mocked(authService.register).mockRejectedValue(new axios.AxiosError(
      'Bad Request',
      '400',
      undefined,
      undefined,
      { status: 400, statusText: 'Bad Request', headers: {}, config: {} as never, data: { message: 'Email is already registered' } },
    ))
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered')
  })
})
