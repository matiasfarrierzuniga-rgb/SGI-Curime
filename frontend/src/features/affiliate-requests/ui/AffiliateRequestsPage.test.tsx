import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAffiliateRequestDetail, useAffiliateRequestMutations, useAffiliateRequestsList } from '../hooks/useAffiliateRequestsQueries'
import type { AffiliateRequest } from '../model/affiliateRequests.types'
import { AffiliateRequestDetail } from './AffiliateRequestDetail'
import { AffiliateRequestsPage } from './AffiliateRequestsPage'

vi.mock('../hooks/useAffiliateRequestsQueries', () => ({
  useAffiliateRequestDetail: vi.fn(),
  useAffiliateRequestMutations: vi.fn(),
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

function detailState(data: AffiliateRequest | undefined = request, refetch = vi.fn()) {
  return { data, isPending: false, isError: false, error: null, refetch }
}

function mutationState() {
  return { mutateAsync: vi.fn(), isPending: false }
}

function deferred<T>() {
  let resolve: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve: resolve! }
}

async function goToSecondPage() {
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  await waitFor(() => expect(useAffiliateRequestsList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))
}

describe('AffiliateRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState() as never)
    vi.mocked(useAffiliateRequestDetail).mockReturnValue(detailState() as never)
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve: mutationState(), reject: mutationState() } as never)
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

  it('opens authoritative detail for the selected request', async () => {
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    await waitFor(() => expect(useAffiliateRequestDetail).toHaveBeenLastCalledWith(7))
    expect(screen.getByRole('dialog', { name: 'Detalle de solicitud de afiliación' })).toBeInTheDocument()
    expect(screen.getByText('Participar en la asociación')).toBeInTheDocument()
    expect(screen.getByText('1 ene 1990')).toBeInTheDocument()
    expect(screen.getByText('+506 88888888')).toBeInTheDocument()
    expect(screen.queryByText('8888-8888')).not.toBeInTheDocument()
  })

  it('keeps detail dialog focus operable and restores it to the invoking action', () => {
    render(<AffiliateRequestsPage />)

    const trigger = screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Detalle de solicitud de afiliación' })
    expect(dialog).toHaveFocus()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Cerrar diálogo' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'Rechazar solicitud' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('keeps responsive filters, table overflow, and detail actions constrained', () => {
    render(<AffiliateRequestsPage />)

    expect(screen.getByLabelText('Búsqueda').closest('form')).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-5')
    expect(screen.getByLabelText('Tabla de solicitudes de afiliación, desplazable horizontalmente')).toHaveClass('overflow-x-auto')
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    expect(screen.getByRole('dialog').querySelector('.overflow-y-auto')).toHaveClass('max-h-[70vh]')
    expect(screen.getByRole('button', { name: 'Aprobar solicitud' }).parentElement).toHaveClass('flex-wrap')
  })

  it('shows loading detail without stale request data', () => {
    vi.mocked(useAffiliateRequestDetail).mockReturnValue({ ...detailState(), data: undefined, isPending: true } as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    expect(screen.getByRole('status')).toHaveTextContent('Cargando detalle de solicitud...')
    expect(screen.queryByText('Participar en la asociación')).not.toBeInTheDocument()
  })

  it('shows terminal review information without approve or reject actions', () => {
    vi.mocked(useAffiliateRequestDetail).mockReturnValue(detailState({ ...request, status: 'APPROVED', reviewedAt: '2026-01-20T00:00:00.000Z', reviewedBy: { id: 2, fullName: 'Luis Admin', email: 'luis@example.test' } }) as never)
    render(<AffiliateRequestsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    expect(screen.getByText('Aprobada', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Luis Admin (luis@example.test)')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aprobar|rechazar/i })).not.toBeInTheDocument()
  })

  it('keeps rejected requests read-only', () => {
    vi.mocked(useAffiliateRequestDetail).mockReturnValue(detailState({ ...request, status: 'REJECTED', rejectionReason: 'Documentación incompleta' }) as never)
    render(<AffiliateRequestsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    expect(screen.getByText('Rechazada', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aprobar solicitud|rechazar solicitud/i })).not.toBeInTheDocument()
  })

  it('shows rejection reason and handles optional values without literal null text', () => {
    vi.mocked(useAffiliateRequestDetail).mockReturnValue(detailState({ ...request, status: 'REJECTED', rejectionReason: 'Documentación incompleta', reviewedAt: '2026-01-20T00:00:00.000Z', reviewedBy: null }) as never)
    render(<AffiliateRequestsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    expect(screen.getByText('Rechazada', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Documentación incompleta')).toBeInTheDocument()
    expect(screen.queryByText('null')).not.toBeInTheDocument()
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
  })

  it('retries failed detail queries', () => {
    const refetch = vi.fn()
    vi.mocked(useAffiliateRequestDetail).mockReturnValue({ ...detailState(), data: undefined, isError: true, error: new Error('fallo'), refetch } as never)
    render(<AffiliateRequestsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))

    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar la solicitud')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('uses structured phones first, with legacy and optional fallbacks', () => {
    const requests = [
      request,
      { ...request, id: 8, fullName: 'Beatriz Mora', phoneCountryCode: null, phoneNationalNumber: '77777777', phone: '7777-0000' },
      { ...request, id: 9, fullName: 'Carlos Rojas', phoneCountryCode: null, phoneNationalNumber: null, phone: '6666-6666' },
      { ...request, id: 10, fullName: 'Diana Vega', phoneCountryCode: null, phoneNationalNumber: null, phone: null },
    ]
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState(requests, 4) as never)
    vi.mocked(useAffiliateRequestDetail).mockImplementation((id) => detailState(requests.find((item) => item.id === id)) as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    expect(screen.getByText('+506 88888888')).toBeInTheDocument()
    expect(screen.queryByText('8888-8888')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Beatriz Mora' }))
    expect(screen.getByText('77777777')).toBeInTheDocument()
    expect(screen.queryByText('7777-0000')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Carlos Rojas' }))
    expect(screen.getByText('6666-6666')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Diana Vega' }))
    expect(within(screen.getByRole('heading', { name: 'Contacto' }).closest('section')!).getByText('No especificado')).toBeInTheDocument()
  })

  it('closes detail and does not leak A while B is pending', async () => {
    const secondRequest = { ...request, id: 8, fullName: 'Beatriz Mora', affiliationReason: 'Apoyar proyectos locales' }
    let bPending = true
    vi.mocked(useAffiliateRequestsList).mockReturnValue(listState([request, secondRequest], 2) as never)
    vi.mocked(useAffiliateRequestDetail).mockImplementation((id) => id === 8 && bPending ? { ...detailState(), data: undefined, isPending: true } as never : detailState(id === 8 ? secondRequest : request) as never)
    const view = render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    expect(screen.getByText('Participar en la asociación')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Beatriz Mora' }))

    await waitFor(() => expect(useAffiliateRequestDetail).toHaveBeenLastCalledWith(8))
    expect(screen.getByRole('status')).toHaveTextContent('Cargando detalle de solicitud...')
    expect(screen.queryByText('Participar en la asociación')).not.toBeInTheDocument()
    bPending = false
    view.rerender(<AffiliateRequestsPage />)
    expect(screen.getByText('Apoyar proyectos locales')).toBeInTheDocument()
  })

  it('confirms approval once, reports success, and refreshes the terminal state', async () => {
    const approve = mutationState()
    let currentRequest = request
    approve.mutateAsync.mockImplementation(async () => { currentRequest = { ...request, status: 'APPROVED' }; return { affiliateRequest: currentRequest } })
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject: mutationState() } as never)
    vi.mocked(useAffiliateRequestDetail).mockImplementation(() => detailState(currentRequest) as never)
    const view = render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    expect(screen.getByRole('dialog', { name: '¿Aprobar esta solicitud?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))

    await waitFor(() => expect(approve.mutateAsync).toHaveBeenCalledTimes(1))
    expect(approve.mutateAsync).toHaveBeenCalledWith(7)
    view.rerender(<AffiliateRequestsPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Solicitud aprobada correctamente.')
    expect(screen.getByText('Aprobada', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aprobar solicitud|rechazar solicitud/i })).not.toBeInTheDocument()
  })

  it('cancels approval without calling its mutation', () => {
    const approve = mutationState()
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject: mutationState() } as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(approve.mutateAsync).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Detalle de solicitud de afiliación' })).toBeInTheDocument()
  })

  it('locks approval controls and close paths while the first confirmation is pending', async () => {
    const approve = mutationState()
    const pending = deferred<unknown>()
    approve.mutateAsync.mockReturnValue(pending.promise)
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject: mutationState() } as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    const confirm = screen.getByRole('button', { name: 'Aprobar' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)

    expect(approve.mutateAsync).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('dialog', { name: '¿Aprobar esta solicitud?' })).toHaveAttribute('aria-busy', 'true'))
    expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cerrar diálogo' })).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!)
    expect(screen.getByRole('dialog', { name: '¿Aprobar esta solicitud?' })).toBeInTheDocument()
    pending.resolve({})
  })

  it('rejects blank and whitespace-only reasons without a mutation', () => {
    const reject = mutationState()
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve: mutationState(), reject } as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Indique un motivo de rechazo.')
    fireEvent.change(screen.getByLabelText('Motivo de rechazo'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(reject.mutateAsync).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Indique un motivo de rechazo.')
  })

  it('confirms rejection once with a trimmed reason and refreshes terminal state', async () => {
    const reject = mutationState()
    let currentRequest = request
    reject.mutateAsync.mockImplementation(async ({ payload }) => { currentRequest = { ...request, status: 'REJECTED', rejectionReason: payload.rejectionReason }; return currentRequest })
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve: mutationState(), reject } as never)
    vi.mocked(useAffiliateRequestDetail).mockImplementation(() => detailState(currentRequest) as never)
    const view = render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar solicitud' }))
    fireEvent.change(screen.getByLabelText('Motivo de rechazo'), { target: { value: ' Documentación incompleta ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('dialog', { name: '¿Rechazar esta solicitud?' })).toHaveTextContent('Documentación incompleta')
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    await waitFor(() => expect(reject.mutateAsync).toHaveBeenCalledWith({ id: 7, payload: { rejectionReason: 'Documentación incompleta' } }))
    view.rerender(<AffiliateRequestsPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Solicitud rechazada correctamente.')
    expect(screen.getByText('Documentación incompleta')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aprobar solicitud|rechazar solicitud/i })).not.toBeInTheDocument()
  })

  it('cancels rejection before confirmation without calling its mutation', () => {
    const reject = mutationState()
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve: mutationState(), reject } as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar solicitud' }))
    fireEvent.change(screen.getByLabelText('Motivo de rechazo'), { target: { value: 'Información incompleta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(reject.mutateAsync).not.toHaveBeenCalled()
  })

  it('locks rejection controls and close paths while the first confirmation is pending', async () => {
    const reject = mutationState()
    const pending = deferred<unknown>()
    reject.mutateAsync.mockReturnValue(pending.promise)
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve: mutationState(), reject } as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar solicitud' }))
    fireEvent.change(screen.getByLabelText('Motivo de rechazo'), { target: { value: 'Información incompleta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    const confirm = screen.getByRole('button', { name: 'Rechazar' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)

    expect(reject.mutateAsync).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('dialog', { name: '¿Rechazar esta solicitud?' })).toHaveAttribute('aria-busy', 'true'))
    expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!)
    expect(screen.getByRole('dialog', { name: '¿Rechazar esta solicitud?' })).toBeInTheDocument()
    pending.resolve({})
  })

  it('keeps approval recoverable after a backend conflict', async () => {
    const approve = mutationState()
    approve.mutateAsync.mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'La solicitud ya fue resuelta.' } } })
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject: mutationState() } as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('La solicitud ya fue resuelta.')
    expect(screen.getByRole('dialog', { name: '¿Aprobar esta solicitud?' })).toBeInTheDocument()
    expect(screen.queryByText('Solicitud aprobada correctamente.')).not.toBeInTheDocument()
  })

  it('keeps rejection recoverable after a backend conflict', async () => {
    const reject = mutationState()
    reject.mutateAsync.mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'La solicitud ya fue resuelta.' } } })
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve: mutationState(), reject } as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar solicitud' }))
    fireEvent.change(screen.getByLabelText('Motivo de rechazo'), { target: { value: 'Información incompleta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('La solicitud ya fue resuelta.')
    expect(screen.getByRole('dialog', { name: '¿Rechazar esta solicitud?' })).toBeInTheDocument()
  })

  it('keeps generic approval errors recoverable without false success', async () => {
    const approve = mutationState()
    approve.mutateAsync.mockRejectedValue(new Error('fallo de red'))
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject: mutationState() } as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible procesar la solicitud. Intente nuevamente.')
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeEnabled()
    expect(screen.queryByText('Solicitud aprobada correctamente.')).not.toBeInTheDocument()
  })

  it('resets A action state and ignores its late result when request B replaces it', async () => {
    const approve = mutationState()
    const pending = deferred<unknown>()
    approve.mutateAsync.mockReturnValue(pending.promise)
    const secondRequest = { ...request, id: 8, fullName: 'Beatriz Mora' }
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject: mutationState() } as never)
    vi.mocked(useAffiliateRequestDetail).mockImplementation((id) => detailState(id === 8 ? secondRequest : request) as never)
    const view = render(<AffiliateRequestDetail requestId={7} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    view.rerender(<AffiliateRequestDetail requestId={8} onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Detalle de solicitud de afiliación' })).toBeInTheDocument())
    expect(screen.getByText('Beatriz Mora')).toBeInTheDocument()
    expect(screen.queryByText('Solicitud aprobada correctamente.')).not.toBeInTheDocument()
    pending.resolve({})
    await Promise.resolve()
    expect(screen.queryByText('Solicitud aprobada correctamente.')).not.toBeInTheDocument()
  })

  it('returns approval conflict to terminal authoritative detail', async () => {
    const approve = mutationState()
    const terminalRequest = { ...request, status: 'APPROVED' as const }
    let currentRequest = request
    const refetch = vi.fn().mockImplementation(async () => { currentRequest = terminalRequest; return { data: terminalRequest } })
    approve.mutateAsync.mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'La solicitud ya fue resuelta.' } } })
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject: mutationState() } as never)
    vi.mocked(useAffiliateRequestDetail).mockImplementation(() => detailState(currentRequest, refetch) as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))

    await waitFor(() => expect(refetch).toHaveBeenCalledOnce())
    expect(screen.getByRole('dialog', { name: 'Detalle de solicitud de afiliación' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('La solicitud ya fue resuelta.')
    expect(screen.queryByRole('button', { name: /aprobar solicitud|rechazar solicitud/i })).not.toBeInTheDocument()
  })

  it('returns rejection conflict to terminal authoritative detail', async () => {
    const reject = mutationState()
    const terminalRequest = { ...request, status: 'REJECTED' as const, rejectionReason: 'Ya fue revisada' }
    let currentRequest = request
    const refetch = vi.fn().mockImplementation(async () => { currentRequest = terminalRequest; return { data: terminalRequest } })
    reject.mutateAsync.mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'La solicitud ya fue resuelta.' } } })
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve: mutationState(), reject } as never)
    vi.mocked(useAffiliateRequestDetail).mockImplementation(() => detailState(currentRequest, refetch) as never)
    render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar solicitud' }))
    fireEvent.change(screen.getByLabelText('Motivo de rechazo'), { target: { value: 'Documentación incompleta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    await waitFor(() => expect(refetch).toHaveBeenCalledOnce())
    expect(screen.getByRole('dialog', { name: 'Detalle de solicitud de afiliación' })).toBeInTheDocument()
    expect(screen.getByText('Ya fue revisada')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aprobar solicitud|rechazar solicitud/i })).not.toBeInTheDocument()
  })

  it('retries approval and rejection successfully after recoverable errors', async () => {
    const approve = mutationState()
    const reject = mutationState()
    let currentRequest = request
    approve.mutateAsync.mockRejectedValueOnce(new Error('fallo')).mockImplementationOnce(async () => { currentRequest = { ...request, status: 'APPROVED' }; return { affiliateRequest: currentRequest } })
    reject.mutateAsync.mockRejectedValueOnce(new Error('fallo')).mockImplementationOnce(async ({ payload }) => { currentRequest = { ...request, status: 'REJECTED', rejectionReason: payload.rejectionReason }; return currentRequest })
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject } as never)
    vi.mocked(useAffiliateRequestDetail).mockImplementation(() => detailState(currentRequest) as never)
    const view = render(<AffiliateRequestsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver solicitud de Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    await waitFor(() => expect(approve.mutateAsync).toHaveBeenCalledTimes(2))
    view.rerender(<AffiliateRequestsPage />)
    expect(screen.getByText('Aprobada', { selector: 'span' })).toBeInTheDocument()

    currentRequest = request
    view.rerender(<AffiliateRequestsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar solicitud' }))
    fireEvent.change(screen.getByLabelText('Motivo de rechazo'), { target: { value: 'Información incompleta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    await waitFor(() => expect(reject.mutateAsync).toHaveBeenCalledTimes(2))
    view.rerender(<AffiliateRequestsPage />)
    expect(screen.getByText('Rechazada', { selector: 'span' })).toBeInTheDocument()
  })
})
