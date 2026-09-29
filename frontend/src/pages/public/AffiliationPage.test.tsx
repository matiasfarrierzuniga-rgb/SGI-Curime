import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AffiliationPage } from './AffiliationPage'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'

vi.mock('../../services/affiliateRequestsService', () => ({ affiliateRequestsService: { create: vi.fn() } }))

function renderPage() {
  return render(<MemoryRouter><AffiliationPage /></MemoryRouter>)
}

function fillForm() {
  fireEvent.change(screen.getByLabelText('Número de identificación'), { target: { value: '123456789' } })
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText('Primer apellido'), { target: { value: 'Pérez' } })
  fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
  fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Curime Centro' } })
  fireEvent.change(screen.getByLabelText('¿Por qué desea afiliarse?'), { target: { value: ' Participar en la comunidad ' } })
}

describe('AffiliationPage public flow', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(affiliateRequestsService.create).mockResolvedValue({} as never) })

  it('shows an operational form without a session', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeVisible()
    expect(screen.queryByText(/Necesita una cuenta/)).not.toBeInTheDocument()
  })

  it('sends visitor identity and optional contact values in the supported payload', async () => {
    renderPage(); fillForm()
    fireEvent.change(screen.getByRole('combobox', { name: 'País' }), { target: { value: 'CR' } })
    fireEvent.change(screen.getByLabelText('Teléfono (opcional)'), { target: { value: '88888888' } })
    fireEvent.change(screen.getByLabelText('Correo electrónico (opcional)'), { target: { value: ' ANA@EXAMPLE.COM ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    await waitFor(() => expect(affiliateRequestsService.create).toHaveBeenCalledWith(expect.objectContaining({ identificationType: 'NATIONAL', identification: '123456789', firstName: 'Ana', firstSurname: 'Pérez', birthDate: '1990-01-01', address: 'Curime Centro', affiliationReason: 'Participar en la comunidad', phoneCountryCode: '+506', phoneNationalNumber: '88888888', email: 'ana@example.com' })))
    const payload = vi.mocked(affiliateRequestsService.create).mock.calls[0][0]
    expect(payload).not.toHaveProperty('userId'); expect(payload).not.toHaveProperty('personId')
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
