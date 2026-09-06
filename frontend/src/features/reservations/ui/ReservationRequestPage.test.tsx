import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReservationRequestPage } from './ReservationRequestPage'
import { useCreateReservation, useReservableResources, useReservationAvailability } from '../hooks/useReservations'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../hooks/useReservations', () => ({ useReservableResources: vi.fn(), useReservationAvailability: vi.fn(), useCreateReservation: vi.fn() }))

const resources = [{ id: 1, name: 'Salón comunal', description: null, location: 'Curime', capacity: 50, status: 'ACTIVE' as const }]
const future = { start: '2030-01-01T10:00', end: '2030-01-01T12:00' }

describe('ReservationRequestPage', () => {
  const mutateAsync = vi.fn()
  const refetch = vi.fn()
  beforeEach(() => {
    vi.mocked(useReservableResources).mockReturnValue({ isPending: false, isError: false, data: resources } as never)
    vi.mocked(useCreateReservation).mockReturnValue({ isPending: false, mutateAsync } as never)
    vi.mocked(useReservationAvailability).mockReturnValue({ isFetching: false, refetch } as never)
    mutateAsync.mockReset(); refetch.mockReset(); vi.mocked(toast.success).mockReset(); vi.mocked(toast.error).mockReset()
  })
  function fill() { fireEvent.change(screen.getByLabelText('Recurso reservable'), { target: { value: '1' } }); fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: future.start } }); fireEvent.change(screen.getByLabelText('Finalización'), { target: { value: future.end } }); fireEvent.change(screen.getByLabelText('Motivo de la reserva'), { target: { value: 'Reunión vecinal' } }) }

  it('loads active resources and blocks submit until availability is checked', () => { render(<ReservationRequestPage />); expect(screen.getByRole('option', { name: /salón comunal/i })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled() })

  it('shows validation errors for an invalid duration', async () => { render(<ReservationRequestPage />); fireEvent.change(screen.getByLabelText('Recurso reservable'), { target: { value: '1' } }); fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: future.start } }); fireEvent.change(screen.getByLabelText('Finalización'), { target: { value: '2030-01-01T10:30' } }); fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i })); expect(await screen.findByText(/duración mínima/i)).toBeInTheDocument() })

  it('sets availability error when refetch fails and does not show unavailable', async () => { refetch.mockRejectedValue(new Error('network failure')); render(<ReservationRequestPage />); fill(); fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i })); expect(await screen.findByText('No fue posible consultar disponibilidad.')).toBeInTheDocument(); expect(screen.queryByText('No disponible para este horario.')).not.toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled() })

  it('sets availability unavailable when API returns available=false', async () => { refetch.mockResolvedValue({ data: { available: false } }); render(<ReservationRequestPage />); fill(); fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i })); expect(await screen.findByText('No disponible para este horario.')).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled() })

  it('sets availability available when API returns available=true and resets on stale input', async () => { refetch.mockResolvedValue({ data: { available: true } }); render(<ReservationRequestPage />); fill(); fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i })); expect(await screen.findByText('Disponible.')).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeEnabled(); fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2030-01-01T11:00' } }); expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled() })

  it('submits UTC payload without requester or status and resets on success', async () => { refetch.mockResolvedValue({ data: { available: true } }); mutateAsync.mockResolvedValue({}); render(<ReservationRequestPage />); fill(); fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i })); await screen.findByText('Disponible.'); fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' })); await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 1, startAt: '2030-01-01T16:00:00.000Z', endAt: '2030-01-01T18:00:00.000Z' }))); expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('requesterUserId'); expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('status'); expect(toast.success).toHaveBeenCalled(); expect(screen.getByLabelText('Motivo de la reserva')).toHaveValue(''); expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled() })

  it('preserves form values and shows conflict feedback after 409 on create', async () => { refetch.mockResolvedValue({ data: { available: true } }); mutateAsync.mockRejectedValue({ response: { status: 409 } }); render(<ReservationRequestPage />); fill(); fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i })); await screen.findByText('Disponible.'); fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' })); expect(await screen.findByText('No disponible para este horario.')).toBeInTheDocument(); expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/ya no está disponible/i)); expect(screen.getByLabelText('Recurso reservable')).toHaveValue('1'); expect(screen.getByLabelText('Inicio')).toHaveValue(future.start); expect(screen.getByLabelText('Finalización')).toHaveValue(future.end); expect(screen.getByLabelText('Motivo de la reserva')).toHaveValue('Reunión vecinal') })
})
