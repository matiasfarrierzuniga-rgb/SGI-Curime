import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreateReservation, useReservableResources, useReservationAvailability } from '../hooks/useReservations'
import { ReservationRequestPage } from './ReservationRequestPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../hooks/useReservations', () => ({ useReservableResources: vi.fn(), useReservationAvailability: vi.fn(), useCreateReservation: vi.fn() }))

const resources = [{ id: 1, name: 'Salón comunal', description: 'Espacio para actividades comunitarias', location: 'Curime', capacity: 50, status: 'ACTIVE' as const, pricingType: 'FREE' as const, price: null, currency: 'CRC' }]
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
    fireEvent.change(screen.getByLabelText(/Espacio/), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/Fecha y hora de inicio/), { target: { value: future.start } })
    fireEvent.change(screen.getByLabelText(/Fecha y hora de finalización/), { target: { value: future.end } })
    fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: 'Reunión vecinal' } })
  }

  it('renders P06 steps and blocks review before availability is checked', () => {
    render(<ReservationRequestPage />)
    expect(screen.getByRole('list', { name: 'Progreso de la solicitud' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map(step => step.textContent)).toEqual(['1Elegir espacio', '2Fecha y horario', '3Revisar y enviar'])
    expect(screen.getByRole('button', { name: 'Revisar solicitud' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/Espacio/), { target: { value: '1' } })
    expect(screen.getByText('Está reservando: Salón comunal')).toBeInTheDocument()
  })

  it('does not consult invalid times and presents distinct checking failures', async () => {
    render(<ReservationRequestPage />)
    fireEvent.change(screen.getByLabelText(/Espacio/), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/Fecha y hora de inicio/), { target: { value: future.start } })
    fireEvent.change(screen.getByLabelText(/Fecha y hora de finalización/), { target: { value: '2030-01-01T10:30' } })
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    expect(await screen.findByText(/al menos una hora/i)).toBeInTheDocument()
    expect(refetch).not.toHaveBeenCalled()

    refetch.mockRejectedValue(new Error('network failure'))
    fireEvent.change(screen.getByLabelText(/Fecha y hora de finalización/), { target: { value: future.end } })
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    expect(await screen.findByText(/No fue posible consultar la disponibilidad/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revisar solicitud' })).toBeDisabled()
  })

  it('invalidates a successful availability check when resource scheduling values change', async () => {
    refetch.mockResolvedValue({ data: { available: true } })
    render(<ReservationRequestPage />); fill()
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    expect(await screen.findByText(/Disponible en este horario/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revisar solicitud' })).toBeEnabled()
    fireEvent.change(screen.getByLabelText(/Fecha y hora de inicio/), { target: { value: '2030-01-01T11:00' } })
    expect(screen.getByText('Aún no ha consultado la disponibilidad.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revisar solicitud' })).toBeDisabled()
  })

  it('requires explicit review, preserves values on return to edit, and submits only once', async () => {
    let resolve!: () => void
    refetch.mockResolvedValue({ data: { available: true } })
    mutateAsync.mockReturnValue(new Promise<void>(done => { resolve = done }))
    render(<ReservationRequestPage />); fill()
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    await screen.findByText(/Disponible en este horario/)
    fireEvent.click(screen.getByRole('button', { name: 'Revisar solicitud' }))
    expect(await screen.findByRole('heading', { name: '3. Revise su solicitud' })).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Volver a editar' }))
    expect(screen.getByLabelText(/Motivo/)).toHaveValue('Reunión vecinal')
    fireEvent.click(screen.getByRole('button', { name: 'Revisar solicitud' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Enviar solicitud' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: /Enviando solicitud/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /Enviando solicitud/ }))
    expect(mutateAsync).toHaveBeenCalledTimes(1)
    await act(async () => resolve())
    expect(await screen.findByRole('heading', { name: 'Solicitud recibida' })).toBeInTheDocument()
    expect(screen.getByText('Su solicitud está pendiente de revisión por la Asociación.')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de revisión')).toBeInTheDocument()
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({ resourceId: 1, startAt: '2030-01-01T16:00:00.000Z', endAt: '2030-01-01T18:00:00.000Z' })
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('requesterUserId')
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('status')
  })

  it.each([[{ response: { status: 409 } }], [new Error('failed')]])('keeps values after backend failure', async error => {
    refetch.mockResolvedValue({ data: { available: true } }); mutateAsync.mockRejectedValue(error)
    render(<ReservationRequestPage />); fill()
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    await screen.findByText(/Disponible en este horario/)
    fireEvent.click(screen.getByRole('button', { name: 'Revisar solicitud' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findByRole('button', { name: 'Revisar solicitud' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Espacio/)).toHaveValue('1')
    expect(screen.getByLabelText(/Fecha y hora de inicio/)).toHaveValue(future.start)
    expect(screen.getByLabelText(/Fecha y hora de finalización/)).toHaveValue(future.end)
    expect(screen.getByLabelText(/Motivo/)).toHaveValue('Reunión vecinal')
    expect(toast.error).toHaveBeenCalled()
  })
})
