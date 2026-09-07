import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReservationDetail } from '../hooks/useReservations'
import { ReservationDetailsModal } from './ReservationDetailsModal'

vi.mock('../hooks/useReservations', () => ({ useReservationDetail: vi.fn() }))

describe('ReservationDetailsModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading while authoritative detail request is pending', () => {
    vi.mocked(useReservationDetail).mockReturnValue({ isPending: true, isError: false } as never)
    render(<ReservationDetailsModal id={11} role="Administrador" busy={false} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} onCancel={vi.fn()} />)
    expect(useReservationDetail).toHaveBeenCalledWith(11)
    expect(screen.getByText('Cargando detalle de reserva...')).toBeInTheDocument()
  })

  it('shows a not-found state for 404 detail response', () => {
    vi.mocked(useReservationDetail).mockReturnValue({ isPending: false, isError: true, error: { response: { status: 404 } }, refetch: vi.fn() } as never)
    render(<ReservationDetailsModal id={11} role="Administrador" busy={false} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Reserva no encontrada')).toBeInTheDocument()
  })
})
