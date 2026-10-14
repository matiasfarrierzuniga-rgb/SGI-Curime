import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth'
import { useReservableResources, useReservationDetail, useReservationMutations, useReservationsList } from '../hooks/useReservations'
import { ReservationAdminPage } from './ReservationAdminPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useReservations', () => ({ useReservableResources: vi.fn(), useReservationDetail: vi.fn(), useReservationMutations: vi.fn(), useReservationsList: vi.fn() }))

const reservation = {
  id: 1, resourceId: 7, resource: { id: 7, name: 'Salón comunal', location: 'Curime' }, requesterUserId: 8, requester: { id: 8, fullName: 'Ana Pérez', email: 'ana@example.com' }, eventId: null, event: null,
  startAt: '2030-01-01T16:00:00.000Z', endAt: '2030-01-01T18:00:00.000Z', purpose: 'Reunión vecinal', estimatedAttendees: 20, notes: 'Notas', status: 'PENDING', approvedAt: null, approvedById: null, approvedBy: null, rejectionReason: null, cancelledAt: null, createdAt: '2030-01-01T10:00:00.000Z', updatedAt: '2030-01-01T10:00:00.000Z',
} as const
const mutations = { approve: { isPending: false, mutateAsync: vi.fn() }, reject: { isPending: false, mutateAsync: vi.fn() }, cancel: { isPending: false, mutateAsync: vi.fn() } }
const approvedReservation = { ...reservation, status: 'APPROVED' } as const

describe('ReservationAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['res.reservations.approve', 'res.reservations.reject', 'res.reservations.cancel'] } } as never)
    vi.mocked(useReservableResources).mockReturnValue({ data: [{ id: 7, name: 'Salón comunal' }] } as never)
    vi.mocked(useReservationsList).mockReturnValue({ isPending: false, isError: false, data: { data: [reservation], total: 21, page: 1, limit: 20 } } as never)
    vi.mocked(useReservationDetail).mockReturnValue({ isPending: false, isError: false, data: reservation } as never)
    vi.mocked(useReservationMutations).mockReturnValue(mutations as never)
    mutations.approve.mutateAsync.mockReset(); mutations.reject.mutateAsync.mockReset(); mutations.cancel.mutateAsync.mockReset()
  })

  it('renders loading, error, and empty states', () => {
    vi.mocked(useReservationsList).mockReturnValue({ isPending: true, isError: false } as never)
    const { rerender } = render(<ReservationAdminPage />)
    expect(screen.getByText('Cargando reservas...')).toBeInTheDocument()
    vi.mocked(useReservationsList).mockReturnValue({ isPending: false, isError: true, error: new Error('falló') } as never)
    rerender(<ReservationAdminPage />)
    expect(screen.getByText('No fue posible cargar las reservas')).toBeInTheDocument()
    vi.mocked(useReservationsList).mockReturnValue({ isPending: false, isError: false, data: { data: [], total: 0, page: 1, limit: 20 } } as never)
    rerender(<ReservationAdminPage />)
    expect(screen.getByText('No hay reservas registradas')).toBeInTheDocument()
  })

  it('retries the existing reservations list query once after an error', () => {
    const refetch = vi.fn()
    vi.mocked(useReservationsList).mockReturnValue({ isPending: false, isError: true, error: new Error('falló'), refetch } as never)
    render(<ReservationAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('sends canonical server filters, resets page on filter change, and uses server pagination', () => {
    render(<ReservationAdminPage />)
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'APPROVED' } })
    expect(vi.mocked(useReservationsList)).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'APPROVED', page: 1, limit: 20 }))
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '09/09/2026' } })
    expect(vi.mocked(useReservationsList)).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'APPROVED', from: '2026-09-09', page: 1, limit: 20 }))
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '10/09/2026' } })
    expect(vi.mocked(useReservationsList)).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'APPROVED', from: '2026-09-09', to: '2026-09-10', page: 1, limit: 20 }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(vi.mocked(useReservationsList)).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'APPROVED', from: '2026-09-09', to: '2026-09-10', page: 2, limit: 20 }))
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(vi.mocked(useReservationsList)).toHaveBeenLastCalledWith({ page: 1, limit: 20 })
  })

  it('shows resource loading and recovery without changing list query ownership', () => {
    vi.mocked(useReservableResources).mockReturnValue({ isPending: true, isError: false } as never)
    const { rerender } = render(<ReservationAdminPage />)
    expect(screen.getByLabelText('Recurso')).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Cargando recursos...' })).toBeInTheDocument()
    const refetch = vi.fn()
    vi.mocked(useReservableResources).mockReturnValue({ isPending: false, isError: true, refetch } as never)
    rerender(<ReservationAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows only Revisar for pending reservations and opens its authoritative detail', () => {
    render(<ReservationAdminPage />)
    expect(screen.getAllByRole('button', { name: 'Revisar' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Ver detalle' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Revisar' })[0])
    expect(useReservationDetail).toHaveBeenLastCalledWith(1)
    expect(screen.getByRole('dialog', { name: /reserva #1/i })).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez · ana@example.com')).toBeInTheDocument()
  })

  it('uses the same pending review entry point on mobile cards', () => {
    render(<ReservationAdminPage />)
    const card = screen.getAllByRole('article').find(article => within(article).queryByText('Reserva #1 · Ana Pérez'))!
    expect(within(card).getByText('Reserva #1 · Ana Pérez')).toBeInTheDocument()
    expect(within(card).getByText('Reunión vecinal')).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Revisar' })).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    fireEvent.click(within(card).getByRole('button', { name: 'Revisar' }))
    expect(useReservationDetail).toHaveBeenLastCalledWith(1)
    expect(screen.getByRole('dialog', { name: /reserva #1/i })).toBeInTheDocument()
  })

  it.each([
    [['res.reservations.approve', 'res.reservations.reject', 'res.reservations.cancel'], ['Aprobar', 'Rechazar', 'Cancelar reserva']],
    [['res.reservations.approve'], ['Aprobar']],
    [[], []],
  ] as const)('keeps pending modal lifecycle actions capability-gated', (permissionCodes, expectedActions) => {
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes } } as never)
    render(<ReservationAdminPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Revisar' })[0])
    for (const action of ['Aprobar', 'Rechazar', 'Cancelar reserva']) {
      expect(screen.queryAllByRole('button', { name: action })).toHaveLength(expectedActions.includes(action) ? 1 : 0)
    }
  })

  it('keeps non-pending detail wording and authorized lifecycle actions', () => {
    vi.mocked(useReservationsList).mockReturnValue({ isPending: false, isError: false, data: { data: [approvedReservation], total: 1, page: 1, limit: 20 } } as never)
    vi.mocked(useReservationDetail).mockReturnValue({ isPending: false, isError: false, data: approvedReservation } as never)
    render(<ReservationAdminPage />)
    expect(screen.getAllByRole('button', { name: 'Ver detalle' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Revisar' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Cancelar reserva' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument()
  })

  it('updates pending presentation to non-pending after approval refreshes the row status', async () => {
    mutations.approve.mutateAsync.mockResolvedValue(undefined)
    const { rerender } = render(<ReservationAdminPage />)
    expect(screen.getAllByRole('button', { name: 'Revisar' })).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'Revisar' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    await waitFor(() => expect(mutations.approve.mutateAsync).toHaveBeenCalledWith(1))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /reserva #1/i })).not.toBeInTheDocument())
    vi.mocked(useReservationsList).mockReturnValue({ isPending: false, isError: false, data: { data: [approvedReservation], total: 1, page: 1, limit: 20 } } as never)
    rerender(<ReservationAdminPage />)
    expect(screen.queryByRole('button', { name: 'Revisar' })).not.toBeInTheDocument()
    const tableRow = screen.getAllByRole('row').find(row => within(row).queryByRole('button', { name: 'Ver detalle' }))!
    const card = screen.getAllByRole('article').find(article => within(article).queryByText('Reserva #1 · Ana Pérez'))!
    expect(within(tableRow).getByRole('button', { name: 'Cancelar reserva' })).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Ver detalle' })).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Cancelar reserva' })).toBeInTheDocument()
  })

  it('keeps pending rows reviewable for read-only users', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: [] } } as never)
    render(<ReservationAdminPage />)
    expect(screen.getAllByRole('button', { name: 'Revisar' })).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'Revisar' })[0])
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument()
  })

  it('confirms approval and blocks second submit while mutation runs', async () => {
    let resolve: () => void = () => undefined
    mutations.approve.mutateAsync.mockImplementation(() => new Promise<void>(done => { resolve = done }))
    render(<ReservationAdminPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Revisar' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    const confirmApproval = screen.getByRole('button', { name: 'Aprobar' })
    fireEvent.click(confirmApproval)
    fireEvent.click(confirmApproval)
    expect(mutations.approve.mutateAsync).toHaveBeenCalledTimes(1)
    resolve()
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Reserva aprobada correctamente.'))
  })

  it('validates and submits rejection reason without losing it after error', async () => {
    mutations.reject.mutateAsync.mockRejectedValue({ response: { status: 409, data: { message: 'Estado inválido' } } })
    render(<ReservationAdminPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Revisar' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar reserva' }))
    expect(await screen.findByText(/al menos 3 caracteres/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Motivo del rechazo'), { target: { value: '  Horario ocupado  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar reserva' }))
    await waitFor(() => expect(mutations.reject.mutateAsync).toHaveBeenCalledWith({ id: 1, rejectionReason: 'Horario ocupado' }))
    expect(screen.getByLabelText('Motivo del rechazo')).toHaveValue('  Horario ocupado  ')
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible actualizar la reserva.')
  })
})
