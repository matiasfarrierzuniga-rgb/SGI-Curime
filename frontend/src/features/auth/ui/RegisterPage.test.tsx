import axios from 'axios'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../api/auth.api'
import { RegisterPage } from './RegisterPage'

vi.mock('../api/auth.api', () => ({ authService: { register: vi.fn() } }))

function fillIdentityStep(secondSurname = 'Mora') {
  fireEvent.change(screen.getByLabelText(/^Nombre$/), { target: { value: 'Ana María' } })
  fireEvent.change(screen.getByLabelText(/Primer apellido/), { target: { value: 'Rodríguez' } })
  if (secondSurname) fireEvent.change(screen.getByLabelText(/Segundo apellido/), { target: { value: secondSurname } })
  fireEvent.change(screen.getByLabelText(/Número de identificación/), { target: { value: '123456789' } })
  fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
}

function fillContactStep() {
  fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: ' ANA@EXAMPLE.COM ' } })
  fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
}

function fillSecurityStep(password = 'Secure12345') {
  fireEvent.change(screen.getByLabelText(/^Contraseña$/), { target: { value: password } })
  fireEvent.change(screen.getByLabelText(/Confirmar contraseña/), { target: { value: password } })
}

function reachSecurityStep(secondSurname = 'Mora') {
  fillIdentityStep(secondSurname)
  fillContactStep()
}

describe('direct RegisterPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('submits normalized account data without tokens or automatic login', async () => {
    vi.mocked(authService.register).mockResolvedValue({} as never)
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    reachSecurityStep()
    fillSecurityStep()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => expect(authService.register).toHaveBeenCalledWith({
      firstName: 'Ana María',
      firstSurname: 'Rodríguez',
      secondSurname: 'Mora',
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

  it('renders a three-step registration flow with structured identity first', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Datos personales' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nombre$/)).toBeRequired()
    expect(screen.getByLabelText(/Primer apellido/)).toBeRequired()
    expect(screen.getByLabelText(/Segundo apellido/)).not.toBeRequired()
    expect(screen.getByLabelText(/Tipo de identificación/)).toHaveValue('NATIONAL')
    expect(screen.queryByLabelText(/Nombre completo/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Correo electrónico/)).not.toBeInTheDocument()
  })

  it('preserves values when navigating backward and forward', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    fillIdentityStep()
    expect(screen.getByRole('heading', { name: 'Contacto' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Atrás/ }))

    expect(screen.getByLabelText(/^Nombre$/)).toHaveValue('Ana María')
    expect(screen.getByLabelText(/Primer apellido/)).toHaveValue('Rodríguez')
    expect(screen.getByLabelText(/Número de identificación/)).toHaveValue('123456789')
  })

  it('blocks advancing when the current step is invalid', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(screen.getByRole('heading', { name: 'Datos personales' })).toBeInTheDocument()
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('omits empty second surname and password confirmation from payload', async () => {
    vi.mocked(authService.register).mockResolvedValue({} as never)
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    reachSecurityStep('')
    fillSecurityStep()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => expect(authService.register).toHaveBeenCalledWith(expect.objectContaining({ secondSurname: undefined })))
    expect(vi.mocked(authService.register).mock.calls[0]?.[0]).not.toHaveProperty('passwordConfirmation')
  })

  it('adapts international phone input to existing backend fields', async () => {
    vi.mocked(authService.register).mockResolvedValue({} as never)
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    fillIdentityStep()
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '+50688881234' } })
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    fillSecurityStep()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => expect(authService.register).toHaveBeenCalledWith(expect.objectContaining({
      phoneCountryCode: '+506',
      phoneNationalNumber: '88881234',
    })))
  })

  it('blocks passwords that do not satisfy the strong policy', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    reachSecurityStep()
    fillSecurityStep('weakpassword')
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByRole('alert')).toHaveTextContent('requisitos')
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows password requirements as live checklist items', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    reachSecurityStep()
    fireEvent.change(screen.getByLabelText(/^Contraseña$/), { target: { value: 'Secure12345' } })

    expect(screen.getByLabelText('Requisitos de contraseña')).toHaveTextContent('10 caracteres')
    expect(screen.getByLabelText('Requisitos de contraseña')).toHaveTextContent('Una mayúscula')
    expect(screen.getByLabelText('Requisitos de contraseña')).toHaveTextContent('Una minúscula')
    expect(screen.getByLabelText('Requisitos de contraseña')).toHaveTextContent('Un número')
  })

  it('shows generic conflict feedback from a 400 response', async () => {
    vi.mocked(authService.register).mockRejectedValue(new axios.AxiosError(
      'Bad Request',
      '400',
      undefined,
      undefined,
      { status: 400, statusText: 'Bad Request', headers: {}, config: {} as never, data: { message: 'Email or identification is already registered' } },
    ))
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    reachSecurityStep()
    fillSecurityStep()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or identification is already registered')
  })
})
