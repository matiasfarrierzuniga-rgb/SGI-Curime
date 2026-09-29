import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AffiliateRequestDetail } from './AffiliateRequestDetail'
import { useAffiliateRequestDetail, useAffiliateRequestMutations } from '../hooks/useAffiliateRequestsQueries'

vi.mock('../hooks/useAffiliateRequestsQueries', () => ({ useAffiliateRequestDetail: vi.fn(), useAffiliateRequestMutations: vi.fn(), useAffiliateRequestsList: vi.fn() }))

const request = { id: 7, fullName: 'Ana Pérez', identification: '123456789', identificationType: 'NATIONAL', birthDate: '1990-01-01T00:00:00.000Z', gender: null, phoneCountryCode: '+506', phoneNationalNumber: '88888888', phone: null, email: 'ana@example.com', address: 'Curime', occupation: null, workplace: null, affiliationReason: 'Participar', status: 'PENDING', rejectionReason: null, reviewedAt: null, reviewedById: null, reviewedBy: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' } as const
describe('AffiliateRequestDetail approval', () => {
  const approve = { mutateAsync: vi.fn(), isPending: false }; const reject = { mutateAsync: vi.fn(), isPending: false }
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAffiliateRequestDetail).mockReturnValue({ data: request, isPending: false, isError: false, refetch: vi.fn() } as never)
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject } as never)
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
