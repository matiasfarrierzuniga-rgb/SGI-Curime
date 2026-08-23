import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { TokenPasswordPage } from './TokenPasswordPage'
import { authService } from '../api/auth.api'

vi.mock('../api/auth.api', () => ({ authService: { activate: vi.fn(), resetPassword: vi.fn() } }))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams('token=abc123')],
  }
})

function renderAt(mode: 'activate' | 'reset') {
  return render(<MemoryRouter initialEntries={['/token']}><TokenPasswordPage mode={mode} /></MemoryRouter>)
}

const fill = (password = 'Secure12345', confirmation = password) => {
  fireEvent.change(screen.getByLabelText('Token'), { target: { value: 'abc123' } })
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: confirmation } })
}

describe.each([
  ['activate', 'Activar cuenta', 'activate'],
  ['reset', 'Restablecer contraseña', 'resetPassword'],
] as const)('TokenPasswordPage (%s)', (mode, heading, serviceMethod) => {
  beforeEach(() => vi.clearAllMocks())

  it('renders heading and preloads the token from the query string', () => {
    renderAt(mode)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getByLabelText('Token')).toHaveValue('abc123')
  })

  it(`submits token and passwords to ${serviceMethod}`, async () => {
    vi.mocked(authService[serviceMethod]).mockResolvedValue({ message: 'Operación exitosa' })
    renderAt(mode)
    fill()
    fireEvent.click(screen.getByRole('button', { name: heading }))
    await waitFor(() => expect(authService[serviceMethod]).toHaveBeenCalledWith({ token: 'abc123', password: 'Secure12345', passwordConfirmation: 'Secure12345' }))
    expect(await screen.findByText('Operación exitosa')).toBeInTheDocument()
  })

  it('blocks submission when passwords do not match', async () => {
    renderAt(mode)
    fill('Secure12345', 'Other123456')
    fireEvent.click(screen.getByRole('button', { name: heading }))
    expect(await screen.findByRole('alert')).toHaveTextContent('no coinciden')
    expect(authService[serviceMethod]).not.toHaveBeenCalled()
  })

  it('maps service errors through the shared error translator', async () => {
    vi.mocked(authService[serviceMethod]).mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { message: 'Token no válido' } } })
    renderAt(mode)
    fill()
    fireEvent.click(screen.getByRole('button', { name: heading }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Token no válido')
  })
})
