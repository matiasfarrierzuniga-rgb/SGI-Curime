import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreateReservation, useReservableResources, useReservationAvailability } from '../hooks/useReservations'
import { ReservationRequestPage } from './ReservationRequestPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../hooks/useReservations', () => ({ useReservableResources: vi.fn(), useReservationAvailability: vi.fn(), useCreateReservation: vi.fn() }))

const resources = [{ id: 1, name: 'Salón comunal', description: 'Espacio para actividades comunitarias', location: 'Curime', capacity: 50, status: 'ACTIVE' as const }]
const future = { start: '2030-01-01T10:00', end: '2030-01-01T12:00' }

describe('ReservationRequestPage', () => {
  const mutateAsync = vi.fn()
  const refetch = vi.fn()
  beforeEach(() => {
    vi.mocked(useReservableResources).mockReturnValue({ isPending: false, isError: false, data: resources } as never)
    vi.mocked(useCreateReservation).mockReturnValue({ isPending: false, mutateAsync } as never)
    vi.mocked(useReservationAvailability).mockReturnValue({ isFetching: false, refetch } as never)
    mutateAsync.mockReset(); refetch.mockReset(); vi.mocked(toast.error).mockReset()
  })
  function fill() {
    fireEvent.change(screen.getByLabelText('Espacio'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora de inicio'), { target: { value: future.start } })
    fireEvent.change(screen.getByLabelText('Fecha y hora de finalización'), { target: { value: future.end } })
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Reunión vecinal' } })
  }

  it('loads spaces, identifies the selected space, and initially blocks submit', () => {
    render(<ReservationRequestPage />)
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Espacio'), { target: { value: '1' } })
    expect(screen.getByText('Está reservando: Salón comunal')).toBeInTheDocument()
    expect(screen.getByText('Capacidad: 50 personas')).toBeInTheDocument()
  })

  it('shows an inline invalid-time error without consulting availability', async () => {
    render(<ReservationRequestPage />)
    fireEvent.change(screen.getByLabelText('Espacio'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora de inicio'), { target: { value: future.start } })
    fireEvent.change(screen.getByLabelText('Fecha y hora de finalización'), { target: { value: '2030-01-01T10:30' } })
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    expect(await screen.findByText(/al menos una hora/i)).toBeInTheDocument()
    expect(refetch).not.toHaveBeenCalled()
  })

  it('distinguishes an availability error from an unavailable time', async () => {
    refetch.mockRejectedValue(new Error('network failure')); render(<ReservationRequestPage />); fill()
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    expect(await screen.findByText(/No fue posible consultar la disponibilidad/)).toBeInTheDocument()
    expect(screen.queryByText(/No disponible en este horario/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled()
  })

  it('blocks unavailable times and invalidates a stale successful check', async () => {
    refetch.mockResolvedValueOnce({ data: { available: false } }).mockResolvedValueOnce({ data: { available: true } })
    render(<ReservationRequestPage />); fill(); fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    expect(await screen.findByText(/No disponible en este horario/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    expect(await screen.findByText('Disponible en este horario.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Fecha y hora de inicio'), { target: { value: '2030-01-01T11:00' } })
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled()
  })

  it('submits only once and keeps a persistent confirmation', async () => {
    let resolve!: () => void
    refetch.mockResolvedValue({ data: { available: true } }); mutateAsync.mockReturnValue(new Promise<void>(done => { resolve = done }))
    render(<ReservationRequestPage />); fill(); fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i })); await screen.findByText('Disponible en este horario.')
    const submit = screen.getByRole('button', { name: 'Enviar solicitud' }); fireEvent.click(submit)
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: 'Enviando solicitud…' }))
    expect(mutateAsync).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Enviando solicitud…' })).toBeDisabled()
    await act(async () => resolve())
    expect(await screen.findByRole('heading', { name: 'Solicitud enviada' })).toBeInTheDocument()
    expect(screen.getByText('Su solicitud fue enviada y será revisada por la Asociación.')).toBeInTheDocument()
    expect(screen.getByText('Salón comunal')).toBeInTheDocument()
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({ resourceId: 1, startAt: '2030-01-01T16:00:00.000Z', endAt: '2030-01-01T18:00:00.000Z' })
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('requesterUserId')
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('status')
  })

  it.each([
    [{ response: { status: 409 } }, /No disponible en este horario/],
    [new Error('failed'), null],
  ])('preserves form values after a backend error', async (error, conflictText) => {
    refetch.mockResolvedValue({ data: { available: true } }); mutateAsync.mockRejectedValue(error)
    render(<ReservationRequestPage />); fill(); fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i })); await screen.findByText('Disponible en este horario.')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    if (conflictText) expect(await screen.findByText(conflictText)).toBeInTheDocument()
    else await screen.findByRole('button', { name: 'Enviar solicitud' })
    expect(screen.getByLabelText('Espacio')).toHaveValue('1')
    expect(screen.getByLabelText('Fecha y hora de inicio')).toHaveValue(future.start)
    expect(screen.getByLabelText('Fecha y hora de finalización')).toHaveValue(future.end)
    expect(screen.getByLabelText('Motivo')).toHaveValue('Reunión vecinal')
    expect(toast.error).toHaveBeenCalled()
  })
})
