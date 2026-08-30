import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAffiliateRequestDetail, useAffiliateRequestsList } from '../hooks/useAffiliateRequestsQueries'
import type { AffiliateRequest } from '../model/affiliateRequests.types'
import { AffiliateRequestsPage } from './AffiliateRequestsPage'

vi.mock('../hooks/useAffiliateRequestsQueries', () => ({
  useAffiliateRequestDetail: vi.fn(),
  useAffiliateRequestsList: vi.fn(),
}))

const request: AffiliateRequest = {
  id: 7,
  fullName: 'Ana Pérez',
  identification: '1-2345-6789',
  identificationType: 'NATIONAL',
  birthDate: '1990-01-01T00:00:00.000Z',
  gender: null,
  phoneCountryCode: '+506',
  phoneNationalNumber: '88888888',
  phone: '8888-8888',
  email: 'ana@example.test',
  address: 'San José',
  occupation: null,
  workplace: null,
  affiliationReason: 'Participar en la asociación',
  status: 'PENDING',
  rejectionReason: null,
  reviewedAt: null,
  reviewedById: null,
  reviewedBy: null,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

function listState(data: AffiliateRequest[] = [request], total = data.length) {
  return {
    data: { data, total, page: 1, limit: 20 },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }
}

function detailState(data: AffiliateRequest | undefined = request) {
  return { data, isPending: false, isError: false, error: null, refetch: vi.fn() }
}

async function goToSecondPage() {
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  await waitFor(() => expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))
}

describe('AffiliateRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState() as never)
    vi.mocked(useAffiliateRequestDetail).mockReturnValue(detailState() as never)
  })

  it('shows loading, error, and unfiltered empty states', () => {
    vi.mocked(useAffiliateRequestsList).mockReturnValueOnce({ ...listState(), isPending: true } as never)
    const view = render(<AffiliateRequestsPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando solicitudes de afiliación...')
    view.unmount()

    vi.mocked(useAffiliateRequestsList).mockReturnValueOnce({ ...listState(), isError: true, error: new Error('fallo') } as never)
    render(<AffiliateRequestsPage />)
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar las solicitudes de afiliación.')
  })

  it('retries after an error without real HTTP', () => {
    const refetch = vi.fn()
    vi.mocked(useAffiliateRequestsList).mockReturnValue({ ...listState(), isError: true, error: new Error('fallo'), refetch } as never)

    render(<AffiliateRequestsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('renders request data and visible status labels', () => {
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState([
      request,
      { ...request, id: 8, status: 'APPROVED' },
      { ...request, id: 9, status: 'REJECTED' },
    ]) as never)

    render(<AffiliateRequestsPage />)

    expect(screen.getByRole('table', { name: 'Listado de solicitudes de afiliación' })).toBeInTheDocument()
    expect(screen.getByText('Pendiente', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Aprobada', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Rechazada', { selector: 'span' })).toBeInTheDocument()
  })

  it('shows filtered empty state and clears filters', async () => {
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState([]) as never)
    render(<AffiliateRequestsPage />)

    expect(screen.getByRole('heading', { name: 'No hay solicitudes de afiliación' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Búsqueda'), { target: { value: 'Ana' } })

    expect(await screen.findByRole('heading', { name: 'No hay resultados para estos filtros' })).toBeInTheDocument()
    const emptyState = screen.getByRole('heading', { name: 'No hay resultados para estos filtros' }).closest('section')
    fireEvent.click(within(emptyState!).getByRole('button', { name: 'Limpiar filtros' }))

    expect(screen.getByLabelText('Búsqueda')).toHaveValue('')
    expect(screen.getByRole('heading', { name: 'No hay solicitudes de afiliación' })).toBeInTheDocument()
  })

  it('keeps structurally incomplete email drafts out of server filters and applies valid email on blur', async () => {
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState([request], 40) as never)
    render(<AffiliateRequestsPage />)

    const email = screen.getByLabelText('Correo electrónico')
    fireEvent.change(email, { target: { value: 'ana@' } })
    fireEvent.blur(email)
    expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ email: '', page: 1 }))

    fireEvent.change(email, { target: { value: 'ana@example' } })
    fireEvent.blur(email)
    expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ email: '', page: 1 }))

    fireEvent.change(email, { target: { value: 'ana@example.com' } })
    fireEvent.blur(email)
    await waitFor(() => expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ email: 'ana@example.com', page: 1 })))

    await goToSecondPage()
    fireEvent.change(email, { target: { value: '' } })
    await waitFor(() => expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ email: '', page: 1 })))
  })

  it('uses unfiltered empty semantics for whitespace-only filters', () => {
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState([]) as never)
    render(<AffiliateRequestsPage />)

    fireEvent.change(screen.getByLabelText('Búsqueda'), { target: { value: '   ' } })

    expect(screen.getByRole('heading', { name: 'No hay solicitudes de afiliación' })).toBeInTheDocument()
  })

  it('resets pagination independently for every supported filter', async () => {
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState([request], 40) as never)
    render(<AffiliateRequestsPage />)

    await goToSecondPage()
    fireEvent.change(screen.getByLabelText('Búsqueda'), { target: { value: 'Ana' } })
    await waitFor(() => expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Ana', page: 1 })))

    await goToSecondPage()
    const email = screen.getByLabelText('Correo electrónico')
    fireEvent.change(email, { target: { value: 'ana@example.test' } })
    fireEvent.blur(email)
    await waitFor(() => expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ email: 'ana@example.test', page: 1 })))

    await goToSecondPage()
    fireEvent.change(screen.getByLabelText('Identificación'), { target: { value: '1-2345-6789' } })
    await waitFor(() => expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ identification: '1-2345-6789', page: 1 })))

    await goToSecondPage()
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'PENDING' } })
    await waitFor(() => expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PENDING', page: 1 })))
  })

  it('uses server pagination controls', async () => {
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState([request], 40) as never)
    render(<AffiliateRequestsPage />)

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, limit: 20 })))
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })

  it('opens authoritative detail for the selected request', async () => {
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    await waitFor(() => expect(useAffiliateRequestDetail).toHaveBeenLastCalledWith(7))
    expect(screen.getByRole('dialog', { name: 'Detalle de solicitud de afiliación' })).toBeInTheDocument()
    expect(screen.getByText('Participar en la asociación')).toBeInTheDocument()
    expect(screen.getByText('1 ene 1990')).toBeInTheDocument()
    expect(screen.getByText('+506 88888888')).toBeInTheDocument()
    expect(screen.queryByText('8888-8888')).not.toBeInTheDocument()
  })

  it('shows loading detail without stale request data', () => {
    vi.mocked(useAffiliateRequestDetail).mockReturnValue({ ...detailState(), data: undefined, isPending: true } as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    expect(screen.getByRole('status')).toHaveTextContent('Cargando detalle de solicitud...')
    expect(screen.queryByText('Participar en la asociación')).not.toBeInTheDocument()
  })

  it('shows terminal review information without approve or reject actions', () => {
    vi.mocked(useAffiliateRequestDetail).mockReturnValue(detailState({ ...request, status: 'APPROVED', reviewedAt: '2026-01-20T00:00:00.000Z', reviewedBy: { id: 2, fullName: 'Luis Admin', email: 'luis@example.test' } }) as never)
    render(<AffiliateRequestsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    expect(screen.getByText('Aprobada', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Luis Admin (luis@example.test)')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aprobar|rechazar/i })).not.toBeInTheDocument()
  })

  it('shows rejection reason and handles optional values without literal null text', () => {
    vi.mocked(useAffiliateRequestDetail).mockReturnValue(detailState({ ...request, status: 'REJECTED', rejectionReason: 'Documentación incompleta', reviewedAt: '2026-01-20T00:00:00.000Z', reviewedBy: null }) as never)
    render(<AffiliateRequestsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    expect(screen.getByText('Rechazada', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Documentación incompleta')).toBeInTheDocument()
    expect(screen.queryByText('null')).not.toBeInTheDocument()
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
  })

  it('retries failed detail queries', () => {
    const refetch = vi.fn()
    vi.mocked(useAffiliateRequestDetail).mockReturnValue({ ...detailState(), data: undefined, isError: true, error: new Error('fallo'), refetch } as never)
    render(<AffiliateRequestsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar la solicitud')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('uses structured phones first, with legacy and optional fallbacks', () => {
    const requests = [
      request,
      { ...request, id: 8, fullName: 'Beatriz Mora', phoneCountryCode: null, phoneNationalNumber: '77777777', phone: '7777-0000' },
      { ...request, id: 9, fullName: 'Carlos Rojas', phoneCountryCode: null, phoneNationalNumber: null, phone: '6666-6666' },
      { ...request, id: 10, fullName: 'Diana Vega', phoneCountryCode: null, phoneNationalNumber: null, phone: null },
    ]
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState(requests, 4) as never)
    vi.mocked(useAffiliateRequestDetail).mockImplementation((id) => detailState(requests.find((item) => item.id === id)) as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    expect(screen.getByText('+506 88888888')).toBeInTheDocument()
    expect(screen.queryByText('8888-8888')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Beatriz Mora' }))
    expect(screen.getByText('77777777')).toBeInTheDocument()
    expect(screen.queryByText('7777-0000')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Carlos Rojas' }))
    expect(screen.getByText('6666-6666')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Diana Vega' }))
    expect(within(screen.getByRole('heading', { name: 'Contacto' }).closest('section')!).getByText('No especificado')).toBeInTheDocument()
  })

  it('closes detail and does not leak A while B is pending', async () => {
    const secondRequest = { ...request, id: 8, fullName: 'Beatriz Mora', affiliationReason: 'Apoyar proyectos locales' }
    let bPending = true
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState([request, secondRequest], 2) as never)
    vi.mocked(useAffiliateRequestDetail).mockImplementation((id) => id === 8 && bPending ? { ...detailState(), data: undefined, isPending: true } as never : detailState(id === 8 ? secondRequest : request) as never)
    const view = render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    expect(screen.getByText('Participar en la asociación')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Beatriz Mora' }))

    await waitFor(() => expect(useAffiliateRequestDetail).toHaveBeenLastCalledWith(8))
    expect(screen.getByRole('status')).toHaveTextContent('Cargando detalle de solicitud...')
    expect(screen.queryByText('Participar en la asociación')).not.toBeInTheDocument()
    bPending = false
    view.rerender(<AffiliateRequestsPage />)
    expect(screen.getByText('Apoyar proyectos locales')).toBeInTheDocument()
  })
})
