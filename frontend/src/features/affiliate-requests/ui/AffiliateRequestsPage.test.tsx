import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AffiliateRequestDetail } from './AffiliateRequestDetail'
import { AffiliateRequestsPage } from './AffiliateRequestsPage'
import { useAffiliateRequestDetail, useAffiliateRequestMutations, useAffiliateRequestsList } from '../hooks/useAffiliateRequestsQueries'

vi.mock('../hooks/useAffiliateRequestsQueries', () => ({ useAffiliateRequestDetail: vi.fn(), useAffiliateRequestMutations: vi.fn(), useAffiliateRequestsList: vi.fn() }))

const request = { id: 7, fullName: 'Ana Pérez', identification: '123456789', identificationType: 'NATIONAL', birthDate: '1990-01-01T00:00:00.000Z', gender: null, phoneCountryCode: '+506', phoneNationalNumber: '88888888', phone: null, email: 'ana@example.com', address: 'Curime', occupation: null, workplace: null, affiliationReason: 'Participar', status: 'PENDING', rejectionReason: null, reviewedAt: null, reviewedById: null, reviewedBy: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' } as const
describe('AffiliateRequestDetail approval', () => {
  const approve = { mutateAsync: vi.fn(), isPending: false }; const reject = { mutateAsync: vi.fn(), isPending: false }
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAffiliateRequestDetail).mockReturnValue({ data: request, isPending: false, isError: false, refetch: vi.fn() } as never)
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject } as never)
    vi.mocked(useAffiliateRequestsList).mockReturnValue({ data: { data: [request], total: 1 }, isPending: false, isError: false, refetch: vi.fn() } as never)
  })

  it('allows approval without role selector', () => {
    render(<AffiliateRequestDetail requestId={7} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Aprobar solicitud' })).toBeEnabled()
    expect(screen.queryByLabelText('Rol funcional')).not.toBeInTheDocument()
  })

  it('approves once with request id', async () => {
    approve.mutateAsync.mockResolvedValue({})
    render(<AffiliateRequestDetail requestId={7} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    const confirm = screen.getByRole('button', { name: 'Aprobar' }); fireEvent.click(confirm); fireEvent.click(confirm)
    await waitFor(() => expect(approve.mutateAsync).toHaveBeenCalledTimes(1))
    expect(approve.mutateAsync).toHaveBeenCalledWith(7)
  })

  it('shows recoverable approval error', async () => {
    approve.mutateAsync.mockRejectedValue(new Error('fallo'))
    render(<AffiliateRequestDetail requestId={7} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' })); fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    expect(await screen.findByRole('alert')).toBeVisible()
  })

  it('rejects with required reason and no role payload', async () => {
    reject.mutateAsync.mockResolvedValue({})
    render(<AffiliateRequestDetail requestId={7} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar solicitud' }))
    fireEvent.change(screen.getByLabelText('Motivo de rechazo'), { target: { value: 'Información incompleta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    await waitFor(() => expect(reject.mutateAsync).toHaveBeenCalledTimes(1))
    expect(reject.mutateAsync).toHaveBeenCalledWith({ id: 7, payload: { rejectionReason: 'Información incompleta' } })
    expect(reject.mutateAsync.mock.calls[0][0]).not.toHaveProperty('role')
  })

  it('renders rejection and review metadata when provided', () => {
    vi.mocked(useAffiliateRequestDetail).mockReturnValue({
      data: {
        ...request,
        status: 'REJECTED',
        rejectionReason: 'Información incompleta',
        reviewedAt: '2026-01-15T12:00:00.000Z',
        reviewedById: 3,
        reviewedBy: { id: 3, fullName: 'Luis Mora', email: 'luis@example.com' },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)

    render(<AffiliateRequestDetail requestId={7} onClose={vi.fn()} />)

    expect(screen.getByText('Rechazada')).toBeVisible()
    expect(screen.getByText('Información incompleta')).toBeVisible()
    expect(screen.getByText('Luis Mora (luis@example.com)')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Aprobar solicitud' })).not.toBeInTheDocument()
  })
})

describe('AffiliateRequestsPage filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAffiliateRequestsList).mockReturnValue({ data: { data: [request], total: 1 }, isPending: false, isError: false, refetch: vi.fn() } as never)
  })

  it('applies a valid email on Enter and shows its applied state', () => {
    render(<AffiliateRequestsPage />)

    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: ' ana@example.com ' } })
    fireEvent.submit(screen.getByLabelText('Correo electrónico').closest('form')!)

    expect(vi.mocked(useAffiliateRequestsList)).toHaveBeenLastCalledWith(expect.objectContaining({ email: 'ana@example.com', page: 1 }))
    expect(screen.getByText('Aplicado: ana@example.com')).toBeVisible()
    expect(screen.getByText('Correo: ana@example.com')).toBeVisible()
  })

  it('keeps an invalid email unapplied and explains how to correct it', () => {
    render(<AffiliateRequestsPage />)

    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'correo-invalido' } })
    fireEvent.submit(screen.getByLabelText('Correo electrónico').closest('form')!)

    expect(screen.getByRole('alert')).toHaveTextContent('Ingrese un correo válido para aplicarlo.')
    expect(vi.mocked(useAffiliateRequestsList)).toHaveBeenLastCalledWith(expect.objectContaining({ email: '', page: 1 }))
  })

  it('makes active filters visible and resets query filters predictably', () => {
    render(<AffiliateRequestsPage />)

    fireEvent.change(screen.getByLabelText('Búsqueda'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'PENDING' } })

    expect(screen.getByText('Búsqueda: Ana')).toBeVisible()
    expect(screen.getByText('Estado: Pendiente')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(vi.mocked(useAffiliateRequestsList)).toHaveBeenLastCalledWith({ search: '', email: '', identification: '', status: undefined, page: 1, limit: 20 })
    expect(screen.queryByText('Filtros aplicados')).not.toBeInTheDocument()
  })
})
