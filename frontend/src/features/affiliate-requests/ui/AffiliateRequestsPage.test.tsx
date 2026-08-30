import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAffiliateRequestsList } from '../hooks/useAffiliateRequestsQueries'
import type { AffiliateRequest } from '../model/affiliateRequests.types'
import { AffiliateRequestsPage } from './AffiliateRequestsPage'

vi.mock('../hooks/useAffiliateRequestsQueries', () => ({
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

async function goToSecondPage() {
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  await waitFor(() => expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))
}

describe('AffiliateRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState() as never)
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
})
