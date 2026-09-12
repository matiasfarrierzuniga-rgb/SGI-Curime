import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AffiliationPage } from './AffiliationPage'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'
import { useAuth } from '@/features/auth'

vi.mock('../../services/affiliateRequestsService', () => ({ affiliateRequestsService: { create: vi.fn() } }))
vi.mock('@/features/auth', async (original) => ({ ...(await original<object>()), useAuth: vi.fn() }))

const user = { id: 7, fullName: 'Ana Pérez', identification: '123456789', identificationType: 'NATIONAL', email: 'ana@example.com', address: 'Curime Centro', phoneCountryCode: '+506', phoneNationalNumber: '88888888', role: 'Subscription_L1', status: 'ACTIVE' }

function renderPage(authenticated = true) {
  vi.mocked(useAuth).mockReturnValue({ user: authenticated ? user : null, isAuthenticated: authenticated, isLoading: false } as never)
  return render(<MemoryRouter><AffiliationPage /></MemoryRouter>)
}

function fillForm() {
  fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
  fireEvent.change(screen.getByLabelText('¿Por qué desea afiliarse?'), { target: { value: ' Participar en la comunidad ' } })
}

describe('AffiliationPage authenticated flow', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(affiliateRequestsService.create).mockResolvedValue({} as never) })

  it('does not expose an operational form without a session and preserves login return', () => {
    renderPage(false)
    expect(screen.queryByRole('button', { name: 'Enviar solicitud' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute('href', '/register')
  })

  it('reuses account identity, prefills address, and sends no spoofable identity fields', async () => {
    renderPage(); fillForm()
    expect(screen.getByText('Ana Pérez')).toBeVisible(); expect(screen.getByText('123456789')).toBeVisible()
    expect(screen.getByLabelText('Dirección')).toHaveValue('Curime Centro')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    await waitFor(() => expect(affiliateRequestsService.create).toHaveBeenCalledWith(expect.objectContaining({ address: 'Curime Centro', affiliationReason: 'Participar en la comunidad' })))
    const payload = vi.mocked(affiliateRequestsService.create).mock.calls[0][0]
    expect(payload).not.toHaveProperty('userId'); expect(payload).not.toHaveProperty('personId'); expect(payload).not.toHaveProperty('identification'); expect(payload).not.toHaveProperty('email')
    expect(await screen.findByRole('heading', { name: 'Recibimos su solicitud' })).toBeVisible()
  })

  it('blocks double submit and preserves useful form state after an error', async () => {
    let reject!: (error: unknown) => void
    vi.mocked(affiliateRequestsService.create).mockReturnValue(new Promise((_resolve, fail) => { reject = fail }) as never)
    renderPage(); fillForm(); const button = screen.getByRole('button', { name: 'Enviar solicitud' })
    fireEvent.click(button); fireEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled()); expect(affiliateRequestsService.create).toHaveBeenCalledTimes(1)
    reject(new Error('fallo'))
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.getByLabelText('¿Por qué desea afiliarse?')).toHaveValue(' Participar en la comunidad ')
  })
})
