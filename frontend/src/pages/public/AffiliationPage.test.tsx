import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userRequestsService } from '@/features/user-requests'
import { httpClient } from '@/shared/api/httpClient'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'
import { AffiliationPage } from './AffiliationPage'

vi.mock('../../services/affiliateRequestsService', () => ({ affiliateRequestsService: { create: vi.fn() } }))
vi.mock('@/features/user-requests', () => ({ userRequestsService: { lookupIdentity: vi.fn() } }))
vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn() } }))

const renderPage = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AffiliationPage /></MemoryRouter></QueryClientProvider>)

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
    vi.mocked(httpClient.get).mockImplementation((url) => {
      const path = String(url)
      const data = path.endsWith('/provinces') ? { catalogVersion: 'fixture-v1', items: [{ code: '5', name: 'GUANACASTE' }] }
        : path.endsWith('/cantons') ? { catalogVersion: 'fixture-v1', items: [{ code: '02', name: 'NICOYA' }] }
          : path.endsWith('/districts') ? { catalogVersion: 'fixture-v1', items: [{ code: '01', name: 'NICOYA' }] }
            : { catalogVersion: 'fixture-v1', items: [{ localityKey: 'loc_1234567890abcdef12345678', name: 'CURIME', category: 'POBLADO' }] }
      return Promise.resolve({ data }) as never
    })
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
    await waitFor(() => expect(screen.getByLabelText('Provincia')).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText('Provincia'), { target: { value: '5' } })
    await waitFor(() => expect(screen.getByLabelText('Cantón')).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText('Cantón'), { target: { value: '02' } })
    await waitFor(() => expect(screen.getByLabelText('Distrito')).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText('Distrito'), { target: { value: '01' } })
    await waitFor(() => expect(screen.getByLabelText('Localidad')).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText('Localidad'), { target: { value: 'loc_1234567890abcdef12345678' } })
    expect(screen.getByText(/no verifica residencia ni determina la aprobación/i)).toBeVisible()
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
       provinceCode: '5', cantonCode: '02', districtCode: '01', catalogVersion: 'fixture-v1', localityKey: 'loc_1234567890abcdef12345678',
    })))
    const payload = vi.mocked(affiliateRequestsService.create).mock.calls[0][0]
    expect(payload).not.toHaveProperty('userId')
    expect(payload).not.toHaveProperty('personId')
    expect(await screen.findByRole('heading', { name: 'Recibimos su solicitud' })).toBeVisible()
  })

  it('clears dependent territorial selections when an ancestor changes', async () => {
    renderPage()
    await reachContact()
    await waitFor(() => expect(screen.getByLabelText('Provincia')).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText('Provincia'), { target: { value: '5' } })
    await waitFor(() => expect(screen.getByLabelText('Cantón')).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText('Cantón'), { target: { value: '02' } })
    await waitFor(() => expect(screen.getByLabelText('Distrito')).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText('Distrito'), { target: { value: '01' } })
    await waitFor(() => expect(screen.getByLabelText('Localidad')).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText('Localidad'), { target: { value: 'loc_1234567890abcdef12345678' } })

    fireEvent.change(screen.getByLabelText('Provincia'), { target: { value: '' } })

    expect(screen.getByLabelText('Cantón')).toHaveValue('')
    expect(screen.getByLabelText('Distrito')).toHaveValue('')
    expect(screen.getByLabelText('Localidad')).toHaveValue('')
    expect(screen.getByLabelText('Cantón')).toBeDisabled()
  })

  it('keeps affiliation available and explains when catalog is unavailable', async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error('unavailable'))
    renderPage()
    await reachContact()

    expect(await screen.findByRole('alert')).toHaveTextContent('Catálogo territorial no disponible')
    expect(screen.getByLabelText('Provincia')).toBeDisabled()
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
