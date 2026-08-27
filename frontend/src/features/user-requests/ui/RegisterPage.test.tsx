import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userRequestsService } from '../api/userRequests.api'
import { RegisterPage } from './RegisterPage'

vi.mock('../api/userRequests.api', () => ({ userRequestsService: { create: vi.fn() } }))

describe('RegisterPage', () => {
  beforeEach(() => vi.clearAllMocks())
  it('limits numeric fields and exposes autocomplete', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    const identification = screen.getByLabelText(/Número de identificación/) as HTMLInputElement
    fireEvent.change(identification, { target: { value: '123456789abc0' } })
    expect(identification.value).toBe('123456789')
    expect(screen.getByLabelText(/Nombre completo/)).toHaveAttribute('autocomplete', 'name')
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
  })
  it('normalizes email and prevents concurrent submit', async () => {
    let release!: () => void
    vi.mocked(userRequestsService.create).mockImplementation(() => new Promise(resolve => { release = () => resolve({} as never) }))
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Ana María' } })
    fireEvent.change(screen.getByLabelText(/Número de identificación/), { target: { value: '123456789' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: ' ANA@EXAMPLE.COM ' } })
    fireEvent.change(screen.getByLabelText(/Motivo de la solicitud/), { target: { value: 'Participar' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form')!)
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
    expect(userRequestsService.create).toHaveBeenCalledTimes(1)
    expect(userRequestsService.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@example.com' }))
    release()
  })
})
