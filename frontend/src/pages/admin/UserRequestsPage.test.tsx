import axios from 'axios'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserRequestsPage } from './UserRequestsPage'
import { ToastProvider } from '@/shared/ui/Toast'
import { userRequestsService } from '@/features/user-requests'
import { rolesService } from '@/features/roles'

const auth = vi.hoisted(() => ({
  user: { permissionCodes: ['usr.user-requests.read', 'usr.user-requests.review'] },
}))

vi.mock('@/features/auth', () => ({ useAuth: () => auth }))
vi.mock('@/features/user-requests', () => ({
  userRequestsService: { list: vi.fn(), approve: vi.fn(), reject: vi.fn() },
}))
vi.mock('@/features/roles', () => ({
  rolesService: { listActive: vi.fn() },
}))

const request = {
  id: 2,
  fullName: 'Solicitud Uno',
  email: 's@test.com',
  identificationType: 'NATIONAL',
  identification: '123456789',
  phoneCountryCode: null,
  phoneNationalNumber: null,
  phone: null,
  address: null,
  reason: 'Quiero participar',
  status: 'PENDING',
  rejectionReason: null,
  reviewedAt: null,
  reviewedById: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as const

const page = () => render(<ToastProvider><UserRequestsPage /></ToastProvider>)

async function openDetail() {
  fireEvent.click(await screen.findByRole('button', { name: 'Ver detalle' }))
  return screen.findByRole('dialog', { name: /Solicitud de/ })
}

describe('UserRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.user.permissionCodes = ['usr.user-requests.read', 'usr.user-requests.review']
    vi.mocked(rolesService.listActive).mockResolvedValue([{ id: 7, name: 'Operador' }])
    vi.mocked(userRequestsService.list).mockResolvedValue({ data: [request], total: 1, page: 1, limit: 10 })
    vi.mocked(userRequestsService.approve).mockResolvedValue(undefined)
    vi.mocked(userRequestsService.reject).mockResolvedValue(request)
  })

  it('lets a reader list, filter, and inspect details without loading review controls or roles', async () => {
    auth.user.permissionCodes = ['usr.user-requests.read']
    page()

    expect(await screen.findByText('Solicitud Uno')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'APPROVED' } })
    await waitFor(() => expect(userRequestsService.list).toHaveBeenLastCalledWith({ page: 1, limit: 10, status: 'APPROVED' }))
    const dialog = await openDetail()
    expect(within(dialog).getByText('Quiero participar')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument()
    expect(rolesService.listActive).not.toHaveBeenCalled()
  })

  it('lets a reviewer approve with a catalog role and explains inactive email activation', async () => {
    page()
    const detail = await openDetail()
    fireEvent.click(within(detail).getByRole('button', { name: 'Aprobar' }))
    const approval = await screen.findByRole('dialog', { name: 'Aprobar solicitud' })
    expect(within(approval).getByText(/cuenta se creará inactiva/i)).toBeInTheDocument()
    expect(within(approval).getByText(/recibirá por correo/i)).toBeInTheDocument()
    fireEvent.change(within(approval).getByLabelText('Rol'), { target: { value: '7' } })
    fireEvent.click(within(approval).getByRole('button', { name: 'Aprobar solicitud' }))

    await waitFor(() => expect(userRequestsService.approve).toHaveBeenCalledWith(2, 7))
    expect(userRequestsService.list).toHaveBeenCalledTimes(2)
  })

  it('keeps identity-review conflicts visible and does not refresh as if approved', async () => {
    vi.mocked(userRequestsService.approve).mockRejectedValue(new axios.AxiosError(
      'Conflict', '409', undefined, undefined,
      { status: 409, statusText: 'Conflict', headers: {}, config: {} as never, data: { message: 'User request person identity requires institutional review' } },
    ))
    page()
    fireEvent.click(within(await openDetail()).getByRole('button', { name: 'Aprobar' }))
    const approval = await screen.findByRole('dialog', { name: 'Aprobar solicitud' })
    fireEvent.change(within(approval).getByLabelText('Rol'), { target: { value: '7' } })
    fireEvent.click(within(approval).getByRole('button', { name: 'Aprobar solicitud' }))

    expect(await screen.findByText(/identidad requiere revisión institucional/i)).toBeInTheDocument()
    expect(userRequestsService.list).toHaveBeenCalledTimes(1)
  })

  it('requires a rejection reason, confirms the destructive action, and reports success', async () => {
    page()
    fireEvent.click(within(await openDetail()).getByRole('button', { name: 'Rechazar' }))
    const reasonDialog = await screen.findByRole('dialog', { name: 'Rechazar solicitud' })
    const continueButton = within(reasonDialog).getByRole('button', { name: 'Continuar' })
    expect(continueButton).toBeDisabled()
    expect(within(reasonDialog).getByLabelText('Motivo del rechazo')).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(within(reasonDialog).getByLabelText('Motivo del rechazo'), { target: { value: 'Datos incompletos' } })
    fireEvent.click(continueButton)
    const confirmation = await screen.findByRole('dialog', { name: 'Confirmar rechazo' })
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Rechazar solicitud' }))

    await waitFor(() => expect(userRequestsService.reject).toHaveBeenCalledWith(2, 'Datos incompletos'))
    expect(await screen.findByText('Solicitud rechazada.')).toBeInTheDocument()
  })
})
