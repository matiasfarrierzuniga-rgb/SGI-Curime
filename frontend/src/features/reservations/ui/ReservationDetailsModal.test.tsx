import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReservationDetail } from '../hooks/useReservations'
import { ReservationDetailsModal } from './ReservationDetailsModal'

vi.mock('../hooks/useReservations', () => ({ useReservationDetail: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { permissionCodes: [] } }) }))

describe('ReservationDetailsModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading while authoritative detail request is pending', () => {
    vi.mocked(useReservationDetail).mockReturnValue({ isPending: true, isError: false } as never)
    render(<ReservationDetailsModal id={11} permissionCodes={[]} busy={false} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} onCancel={vi.fn()} />)
    expect(useReservationDetail).toHaveBeenCalledWith(11)
    expect(screen.getByText('Cargando detalle de reserva...')).toBeInTheDocument()
  })

  it('shows a not-found state for 404 detail response', () => {
    vi.mocked(useReservationDetail).mockReturnValue({ isPending: false, isError: true, error: { response: { status: 404 } }, refetch: vi.fn() } as never)
    render(<ReservationDetailsModal id={11} permissionCodes={[]} busy={false} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Reserva no encontrada')).toBeInTheDocument()
  })

  it('retries the existing detail query once after an error', () => {
    const refetch = vi.fn()
    vi.mocked(useReservationDetail).mockReturnValue({ isPending: false, isError: true, error: new Error('falló'), refetch } as never)
    render(<ReservationDetailsModal id={11} permissionCodes={[]} busy={false} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('organizes returned detail into request, resource, and lifecycle sections', () => {
    vi.mocked(useReservationDetail).mockReturnValue({ isPending: false, isError: false, data: { id: 11, status: 'PENDING', createdAt: '2030-01-01T10:00:00.000Z', requester: { fullName: 'Ana Pérez', email: 'ana@example.com' }, resource: { name: 'Salón comunal', location: 'Curime' }, event: null, startAt: '2030-01-01T16:00:00.000Z', endAt: '2030-01-01T18:00:00.000Z', purpose: 'Reunión vecinal', estimatedAttendees: 20, notes: 'Notas extensas', approvedBy: null, approvedAt: null, rejectionReason: null, cancelledAt: null, financialCharge: null } } as never)
    render(<ReservationDetailsModal id={11} permissionCodes={[]} busy={false} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Solicitud' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recurso' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Estado y seguimiento' })).toBeInTheDocument()
    expect(screen.getByText('Notas extensas')).toBeInTheDocument()
  })
})
