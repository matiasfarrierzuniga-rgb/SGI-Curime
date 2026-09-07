import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAbsenceJustificationsList, useAbsenceJustificationsMutations } from '../hooks/useAbsenceJustificationsQueries'
import { AbsenceJustificationsPage } from './AbsenceJustificationsPage'

vi.mock('../hooks/useAbsenceJustificationsQueries', () => ({
  useAbsenceJustificationsList: vi.fn(),
  useAbsenceJustificationsMutations: vi.fn(),
}))

const item = {
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
  attachment: { originalName: 'evidencia.pdf', mimeType: 'application/pdf', size: 153000 },
}

describe('AbsenceJustificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAbsenceJustificationsList).mockReturnValue({
      data: { data: [item], total: 1, page: 1, limit: 20 },
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never)
    vi.mocked(useAbsenceJustificationsMutations).mockReturnValue({
      approve: { mutateAsync: vi.fn(), isPending: false },
      reject: { mutateAsync: vi.fn(), isPending: false },
    } as never)
  })

  it('renders pending justifications in a table and requires an observation before rejecting', () => {
    render(<AbsenceJustificationsPage />)

    expect(screen.getByRole('table', { name: 'Listado de justificaciones pendientes' })).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    expect(screen.getByLabelText('Observación')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar rechazo' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Observación'), { target: { value: 'Falta evidencia clara.' } })

    expect(screen.getByRole('button', { name: 'Confirmar rechazo' })).toBeEnabled()
  })
})
