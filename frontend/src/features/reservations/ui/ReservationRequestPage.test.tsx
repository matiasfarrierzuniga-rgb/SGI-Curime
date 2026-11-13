import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreateReservation, useReservableResources, useReservationAvailability } from '../hooks/useReservations'
import { ReservationRequestPage } from './ReservationRequestPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../hooks/useReservations', () => ({ useReservableResources: vi.fn(), useReservationAvailability: vi.fn(), useCreateReservation: vi.fn() }))
vi.mock('@/shared/ui/date-picker/DatePicker', () => ({
  DateRangePicker: ({ startId, endId, startLabel, endLabel, startValue, endValue, onStartChange, onEndChange }: {
    startId?: string; endId?: string; startLabel: string; endLabel: string; startValue: string; endValue: string
    onStartChange: (value: string) => void; onEndChange: (value: string) => void
  }) => <>
    <label htmlFor={startId}>{startLabel}</label><input id={startId} type="date" value={startValue} onChange={event => onStartChange(event.target.value)} />
    <label htmlFor={endId}>{endLabel}</label><input id={endId} type="date" value={endValue} onChange={event => onEndChange(event.target.value)} />
  </>,
}))

const resources = [{ id: 1, name: 'Salón Comunal', description: 'Espacio para actividades comunitarias', location: 'Curime', capacity: 50, status: 'ACTIVE' as const, pricingType: 'FREE' as const, price: null, currency: 'CRC' }]

function selectReservationDateRange() {
  fireEvent.change(document.getElementById('reservation-start-date')!, { target: { value: '2030-01-01' } })
  fireEvent.change(document.getElementById('reservation-end-date')!, { target: { value: '2030-01-01' } })
}

function reservationTimeInput(id: 'reservation-start-time' | 'reservation-end-time') {
  const input = document.getElementById(id)
  if (!(input instanceof HTMLInputElement) || input.type !== 'time') throw new Error(`Expected time input #${id}`)
  return input
}

function submitRequestForm() {
  const form = document.querySelector('form')
  if (!form) throw new Error('Expected reservation request form')
  fireEvent.submit(form)
}

function forceUnavailableApplicantCategory() {
  const select = screen.getByLabelText(/Categoría de solicitante/) as HTMLSelectElement
  const option = Array.from(select.options).find(item => item.value === 'GROUPS_COMMITTEES')
  if (!option) throw new Error('Expected groups and committees option')
  option.selected = true
  fireEvent.change(select)
}

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
    selectReservationDateRange()
    fireEvent.change(reservationTimeInput('reservation-start-time'), { target: { value: '10:00' } })
    fireEvent.change(reservationTimeInput('reservation-end-time'), { target: { value: '12:00' } })
    fireEvent.change(screen.getByLabelText(/Actividad/), { target: { value: 'DANCES' } })
    fireEvent.change(screen.getByLabelText(/Categoría de solicitante/), { target: { value: 'PRIVATE' } })
    fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: 'Reunión vecinal' } })
    expect(screen.getByText(/Tarifa de la solicitud:.*90/)).toBeInTheDocument()
  }

  it('renders P06 steps and blocks review before availability is checked', () => {
    render(<ReservationRequestPage />)
    expect(screen.getByRole('list', { name: 'Progreso de la solicitud' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map(step => step.textContent)).toEqual(['1Elegir espacio', '2Fecha y horario', '3Revisar y enviar'])
    expect(screen.getByRole('button', { name: 'Revisar solicitud' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/Espacio/), { target: { value: '1' } })
    expect(screen.getByText('Está reservando: Salón Comunal')).toBeInTheDocument()
  })

  it('blocks activities without a defined tariff even when the space is available', async () => {
    refetch.mockResolvedValue({ data: { available: true } })
    render(<ReservationRequestPage />); fill()
    fireEvent.change(screen.getByLabelText(/Actividad/), { target: { value: 'SPORTS' } })
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    expect(await screen.findByText(/No hay tarifa definida para esta combinación/)).toBeInTheDocument()
    expect(await screen.findByText(/Disponible en este horario/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revisar solicitud' })).toBeDisabled()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it.each(['0', '-1', '1.5'])('blocks invalid estimated attendees: %s', async attendees => {
    render(<ReservationRequestPage />); fill()
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Cantidad de personas/), { target: { value: attendees } })
    })
    submitRequestForm()
    expect(await screen.findByText('Indique una cantidad válida de personas.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '3. Revise su solicitud' })).not.toBeInTheDocument()
  })

  it('accepts a positive integer estimated attendees value', async () => {
    refetch.mockResolvedValue({ data: { available: true } })
    render(<ReservationRequestPage />); fill()
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Cantidad de personas/), { target: { value: '25' } })
    })
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    expect(await screen.findByText(/Disponible en este horario/)).toBeInTheDocument()
    submitRequestForm()
    expect(await screen.findByRole('heading', { name: '3. Revise su solicitud' })).toBeInTheDocument()
  })

  it('does not consult invalid times and presents distinct checking failures', async () => {
    render(<ReservationRequestPage />)
    fireEvent.change(screen.getByLabelText(/Espacio/), { target: { value: '1' } })
    selectReservationDateRange()
    fireEvent.change(reservationTimeInput('reservation-start-time'), { target: { value: '10:00' } })
    fireEvent.change(reservationTimeInput('reservation-end-time'), { target: { value: '10:30' } })
    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    expect(await screen.findByText(/al menos una hora/i)).toBeInTheDocument()
    expect(refetch).not.toHaveBeenCalled()

    refetch.mockRejectedValue(new Error('network failure'))
    fireEvent.change(reservationTimeInput('reservation-end-time'), { target: { value: '12:00' } })
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
    await act(async () => {
      fireEvent.change(reservationTimeInput('reservation-start-time'), { target: { value: '11:00' } })
    })
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
    expect(screen.getByLabelText(/Actividad/)).toHaveValue('DANCES')
    expect(screen.getByLabelText(/Categoría de solicitante/)).toHaveValue('PRIVATE')
    fireEvent.click(screen.getByRole('button', { name: 'Revisar solicitud' }))
    const sendButton = await screen.findByRole('button', { name: 'Enviar solicitud' })
    expect(sendButton).toBeEnabled()
    fireEvent.click(sendButton)
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
    const sendButton = await screen.findByRole('button', { name: 'Enviar solicitud' })
    expect(sendButton).toBeEnabled()
    fireEvent.click(sendButton)
    expect(await screen.findByRole('button', { name: 'Revisar solicitud' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Espacio/)).toHaveValue('1')
    expect(document.getElementById('reservation-start-date')).toHaveValue('2030-01-01')
    expect(document.getElementById('reservation-end-date')).toHaveValue('2030-01-01')
    expect(reservationTimeInput('reservation-start-time')).toHaveValue('10:00')
    expect(reservationTimeInput('reservation-end-time')).toHaveValue('12:00')
    expect(screen.getByLabelText(/Motivo/)).toHaveValue('Reunión vecinal')
    expect(screen.getByLabelText(/Actividad/)).toHaveValue('DANCES')
    expect(screen.getByLabelText(/Categoría de solicitante/)).toHaveValue('PRIVATE')
    expect(toast.error).toHaveBeenCalled()
  })

  it('keeps the groups and committees category visible but disabled with a short notice', () => {
    render(<ReservationRequestPage />)
    const select = screen.getByLabelText(/Categoría de solicitante/)
    const option = Array.from((select as HTMLSelectElement).options).find(item => item.value === 'GROUPS_COMMITTEES')
    expect(option).toBeDefined()
    expect(option).toBeDisabled()
    expect(option?.textContent).toContain('Grupos y comités')
    expect(screen.getByText(/Esta categoría estará disponible próximamente/)).toBeInTheDocument()
  })

  it('keeps the private and member categories selectable with their published tariffs', async () => {
    render(<ReservationRequestPage />)
    const select = screen.getByLabelText(/Categoría de solicitante/) as HTMLSelectElement
    const memberOption = Array.from(select.options).find(item => item.value === 'MEMBERS')
    const privateOption = Array.from(select.options).find(item => item.value === 'PRIVATE')
    expect(memberOption).toBeEnabled()
    expect(privateOption).toBeEnabled()

    fireEvent.change(screen.getByLabelText(/Espacio/), { target: { value: '1' } })
    selectReservationDateRange()
    fireEvent.change(reservationTimeInput('reservation-start-time'), { target: { value: '10:00' } })
    fireEvent.change(reservationTimeInput('reservation-end-time'), { target: { value: '12:00' } })
    fireEvent.change(screen.getByLabelText(/Actividad/), { target: { value: 'BINGO' } })
    fireEvent.change(select, { target: { value: 'MEMBERS' } })
    expect(screen.getByText(/Tarifa de la solicitud:.*35/)).toBeInTheDocument()
    fireEvent.change(select, { target: { value: 'PRIVATE' } })
    expect(screen.getByText(/Tarifa de la solicitud:.*50/)).toBeInTheDocument()
  })

  it('does not allow sending a request with the unavailable category', async () => {
    refetch.mockResolvedValue({ data: { available: true } })
    render(<ReservationRequestPage />)
    fireEvent.change(screen.getByLabelText(/Espacio/), { target: { value: '1' } })
    selectReservationDateRange()
    fireEvent.change(reservationTimeInput('reservation-start-time'), { target: { value: '10:00' } })
    fireEvent.change(reservationTimeInput('reservation-end-time'), { target: { value: '12:00' } })
    fireEvent.change(screen.getByLabelText(/Actividad/), { target: { value: 'DANCES' } })
    fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: 'Reunión vecinal' } })
    forceUnavailableApplicantCategory()

    fireEvent.click(screen.getByRole('button', { name: /consultar disponibilidad/i }))
    await screen.findByText(/Disponible en este horario/)
    submitRequestForm()

    expect(await screen.findByText(/Esta categoría estará disponible próximamente/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '3. Revise su solicitud' })).not.toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
