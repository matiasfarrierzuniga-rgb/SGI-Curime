import axios from 'axios'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userRequestsService } from '../api/userRequests.api'
import { RegisterPage } from './RegisterPage'

vi.mock('../api/userRequests.api', () => ({ userRequestsService: { create: vi.fn() } }))

describe('RegisterPage', () => {
  beforeEach(() => vi.clearAllMocks())

  function fillRequiredSnapshots() {
    fireEvent.change(screen.getByLabelText(/^Nombre$/), { target: { value: 'Ana María' } })
    fireEvent.change(screen.getByLabelText(/Primer apellido/), { target: { value: 'Rodríguez' } })
    fireEvent.change(screen.getByLabelText(/Número de identificación/), { target: { value: '123456789' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: ' ANA@EXAMPLE.COM ' } })
    fireEvent.change(screen.getByLabelText(/Motivo de la solicitud/), { target: { value: 'Participar' } })
  }

  it('limits numeric fields and exposes autocomplete', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    const identification = screen.getByLabelText(/Número de identificación/) as HTMLInputElement
    fireEvent.change(identification, { target: { value: '123456789abc0' } })
    expect(identification.value).toBe('123456789')
    expect(screen.getByLabelText(/^Nombre$/)).toHaveAttribute('autocomplete', 'given-name')
    expect(screen.getByLabelText(/Primer apellido/)).toHaveAttribute('autocomplete', 'family-name')
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
  })
  it('submits required identity/contact snapshots to public registration without an auth session', async () => {
    let release!: () => void
    vi.mocked(userRequestsService.create).mockImplementation(() => new Promise(resolve => { release = () => resolve({} as never) }))
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillRequiredSnapshots()
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form')!)
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
    expect(userRequestsService.create).toHaveBeenCalledTimes(1)
    expect(userRequestsService.create).toHaveBeenCalledWith({
      firstName: 'Ana María',
      firstSurname: 'Rodríguez',
      secondSurname: undefined,
      fullName: 'Ana María Rodríguez',
      identificationType: 'NATIONAL',
      identification: '123456789',
      email: 'ana@example.com',
      phoneCountryCode: undefined,
      phoneNationalNumber: undefined,
      address: undefined,
      reason: 'Participar',
    })
    release()
    expect(localStorage).toHaveLength(0)
    expect(sessionStorage).toHaveLength(0)
  })

  it('confirms pending administrative review and does not redirect after submission', async () => {
    vi.mocked(userRequestsService.create).mockResolvedValue({} as never)
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillRequiredSnapshots()
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form')!)

    expect(await screen.findByText(/pendiente de revisión administrativa/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(authenticatedStorage()).toBe(false)
  })

  function authenticatedStorage() {
    return localStorage.length > 0 || sessionStorage.length > 0
  }

  it('shows duplicate request feedback from the UserRequest endpoint', async () => {
    vi.mocked(userRequestsService.create).mockRejectedValue(new axios.AxiosError(
      'Conflict',
      '409',
      undefined,
      undefined,
      { status: 409, statusText: 'Conflict', headers: {}, config: {} as never, data: { message: 'A pending request already uses this email' } },
    ))
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillRequiredSnapshots()
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form')!)

    expect(await screen.findByRole('alert')).toHaveTextContent('A pending request already uses this email')
  })

  it('constructs a three-part full-name snapshot without submitting a Person link', async () => {
    vi.mocked(userRequestsService.create).mockResolvedValue({} as never)
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fillRequiredSnapshots()
    fireEvent.change(screen.getByLabelText(/Segundo apellido/), { target: { value: 'Mora' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form')!)

    await waitFor(() => expect(userRequestsService.create).toHaveBeenCalledWith(expect.objectContaining({
      firstName: 'Ana María',
      firstSurname: 'Rodríguez',
      secondSurname: 'Mora',
      fullName: 'Ana María Rodríguez Mora',
    })))
    expect(userRequestsService.create.mock.calls[0]?.[0]).not.toHaveProperty('personId')
  })
})
