import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { toast } from 'sonner'
import { useAbsenceJustificationsList, useAbsenceJustificationsMutations } from '../hooks/useAbsenceJustificationsQueries'
import type { AbsenceJustification } from '../model/absenceJustifications.types'
import { AbsenceJustificationsPage } from './AbsenceJustificationsPage'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('../hooks/useAbsenceJustificationsQueries', () => ({
  useAbsenceJustificationsList: vi.fn(),
  useAbsenceJustificationsMutations: vi.fn(),
}))

const item: AbsenceJustification = {
  id: 12,
  reason: 'No pude asistir por un inconveniente familiar y cuento con respaldo.',
  status: 'PENDING' as const,
  rejectionReason: null,
  decisionNote: null,
  reviewedAt: null,
  reviewedById: null,
  assemblyId: 7,
  affiliateId: 3,
  assembly: { id: 7, title: 'Asamblea general', date: '2026-09-01T18:00:00.000Z' },
  affiliate: { id: 3, fullName: 'Ana Pérez', identification: '123456789' },
  reviewedBy: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  attachmentOriginalName: 'evidencia.pdf',
  attachmentMimeType: 'application/pdf',
  attachmentSize: 153000,
}

const query = (data: AbsenceJustification[] = [item]) => vi.mocked(useAbsenceJustificationsList).mockReturnValue({
  data: { data, total: data.length, page: 1, limit: 20 },
  isPending: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
} as never)

describe('AbsenceJustificationsPage', () => {
  const approve = vi.fn()
  const reject = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['adm.justifications.approve', 'adm.justifications.reject'] } } as never)
    query()
    approve.mockResolvedValue(undefined)
    reject.mockResolvedValue(undefined)
    vi.mocked(useAbsenceJustificationsMutations).mockReturnValue({
      approve: { mutateAsync: approve, isPending: false },
      reject: { mutateAsync: reject, isPending: false },
    } as never)
  })

  it('muestra datos, estados en español y acción principal autorizada', () => {
    render(<AbsenceJustificationsPage />)

    expect(screen.getByRole('table', { name: 'Listado de justificaciones' })).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeEnabled()
  })

  it('muestra estado vacío', () => {
    query([])
    render(<AbsenceJustificationsPage />)
    expect(screen.getByText('No hay justificaciones de ausencia')).toBeInTheDocument()
  })

  it('oculta acciones de revisión sin permisos', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: [] } } as never)
    render(<AbsenceJustificationsPage />)
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(screen.getByText('Sin permiso para revisar')).toBeInTheDocument()
  })

  it('tolera relaciones opcionales y muestra estado final', () => {
    query([{ ...item, status: 'REJECTED' as const, affiliate: null, assembly: null, attachmentOriginalName: null, attachmentMimeType: null, attachmentSize: null }])
    render(<AbsenceJustificationsPage />)
    expect(screen.getByText('Rechazada')).toBeInTheDocument()
    expect(screen.getByText('Persona sin registro')).toBeInTheDocument()
    expect(screen.getByText('Asamblea sin registro')).toBeInTheDocument()
    expect(screen.getByText('Revisión cerrada')).toBeInTheDocument()
  })

  it('confirma aprobación y comunica éxito', async () => {
    render(<AbsenceJustificationsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aprobación' }))

    await waitFor(() => expect(approve).toHaveBeenCalledWith({ id: 12, payload: undefined }))
    expect(toast.success).toHaveBeenCalledWith('Justificación aprobada correctamente.')
  })

  it('requiere observación antes de rechazar', () => {
    render(<AbsenceJustificationsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    expect(screen.getByLabelText('Observación (obligatoria)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar rechazo' })).toBeDisabled()
  })
})
