import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userRequestsService } from '@/features/user-requests'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'
import { AffiliationPage } from './AffiliationPage'

vi.mock('../../services/affiliateRequestsService', () => ({ affiliateRequestsService: { create: vi.fn() } }))
vi.mock('@/features/user-requests', () => ({ userRequestsService: { lookupIdentity: vi.fn() } }))

const renderPage = () => render(<MemoryRouter><AffiliationPage /></MemoryRouter>)

async function reachContact() {
  fireEvent.change(screen.getByLabelText(/Número de identificación/), { target: { value: '123456789' } })
  fireEvent.change(screen.getByLabelText(/Nombre\(s\)/), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText(/Primer apellido/), { target: { value: 'Pérez' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  expect(await screen.findByRole('heading', { name: 'Información de contacto' })).toBeVisible()
}

async function reachApplication() {
  await reachContact()
  fireEvent.change(screen.getByLabelText(/Dirección/), { target: { value: 'Curime Centro' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  expect(await screen.findByRole('heading', { name: 'Información de la solicitud' })).toBeVisible()
}

function finishApplication() {
  fireEvent.change(screen.getByLabelText(/Fecha de nacimiento/), { target: { value: '01/01/1990' } })
  fireEvent.blur(screen.getByLabelText(/Fecha de nacimiento/))
  fireEvent.change(screen.getByLabelText(/Por qué desea afiliarse/), { target: { value: ' Participar en la comunidad ' } })
}

describe('AffiliationPage public flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(affiliateRequestsService.create).mockResolvedValue({} as never)
    vi.mocked(userRequestsService.lookupIdentity).mockResolvedValue({ found: false } as never)
  })

  it('shows the three-step visitor form and blocks incomplete identity', async () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Datos de identidad' })).toBeVisible()
    expect(screen.getByRole('navigation', { name: 'Progreso de la solicitud' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Enviar solicitud' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Datos de identidad' })).toBeVisible()
    expect(affiliateRequestsService.create).not.toHaveBeenCalled()
    expect(screen.queryByText(/Necesita una cuenta/)).not.toBeInTheDocument()
  })

  it('preserves values across steps and validates before sending', async () => {
    renderPage()
    await reachApplication()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    expect(affiliateRequestsService.create).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByRole('heading', { name: 'Información de contacto' })).toBeVisible()
    expect(screen.getByLabelText(/Dirección/)).toHaveValue('Curime Centro')
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByRole('heading', { name: 'Datos de identidad' })).toBeVisible()
    expect(screen.getByLabelText(/Nombre\(s\)/)).toHaveValue('Ana')
  })

  it('sends visitor identity and optional contact values in the supported payload', async () => {
    renderPage()
    await reachContact()
    fireEvent.change(screen.getByLabelText(/Dirección/), { target: { value: 'Curime Centro' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '88888888' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: ' ANA@EXAMPLE.COM ' } })
    expect(screen.getByLabelText(/Dirección/)).toHaveValue('Curime Centro')
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByRole('heading', { name: 'Información de la solicitud' })).toBeVisible()
    finishApplication()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    await waitFor(() => expect(affiliateRequestsService.create).toHaveBeenCalledWith(expect.objectContaining({
      identificationType: 'NATIONAL', identification: '123456789', firstName: 'Ana', firstSurname: 'Pérez',
      birthDate: expect.stringMatching(/^1990-01-01T\d{2}:\d{2}:\d{2}\.\d{3}Z$/), address: 'Curime Centro',
      affiliationReason: 'Participar en la comunidad', phoneCountryCode: '+506', phoneNationalNumber: '88888888', email: 'ana@example.com',
    })))
    const payload = vi.mocked(affiliateRequestsService.create).mock.calls[0][0]
    expect(payload).not.toHaveProperty('userId')
    expect(payload).not.toHaveProperty('personId')
    expect(await screen.findByRole('heading', { name: 'Recibimos su solicitud' })).toBeVisible()
  })

  it('blocks double submit and preserves form state after a server error', async () => {
    let reject!: (error: unknown) => void
    vi.mocked(affiliateRequestsService.create).mockReturnValue(new Promise((_resolve, fail) => { reject = fail }) as never)
    renderPage()
    await reachApplication()
    finishApplication()
    const button = screen.getByRole('button', { name: 'Enviar solicitud' })
    fireEvent.click(button)
    fireEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
    expect(affiliateRequestsService.create).toHaveBeenCalledTimes(1)
    reject(new Error('fallo'))
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.getByLabelText(/Por qué desea afiliarse/)).toHaveValue(' Participar en la comunidad ')
  })
})
