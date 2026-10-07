import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAssemblies } from '@/features/assemblies'
import { useAttendanceSummary } from '../hooks/useAdminReportsQueries'
import { AssembliesReportPanel } from './AssembliesReportPanel'

vi.mock('@/features/assemblies', () => ({ useAssemblies: vi.fn() }))
vi.mock('../hooks/useAdminReportsQueries', () => ({
  useAttendanceSummary: vi.fn(),
}))

const assembly = {
  id: 4,
  title: 'Asamblea ordinaria',
  type: 'ORDINARY',
  date: '2026-06-15T16:00:00.000Z',
  place: 'Salón comunal',
  description: null,
  status: 'COMPLETED' as const,
  quorumType: null,
  quorumValue: null,
  convocationsLockedAt: null,
  _count: { convocations: 8 },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAssemblies).mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      data: [assembly],
      total: 1,
      page: 1,
      limit: 20,
      byStatus: [{ status: 'COMPLETED', count: 1 }],
      byType: [{ type: 'ORDINARY', count: 1 }],
    },
    refetch: vi.fn(),
  } as never)
  vi.mocked(useAttendanceSummary).mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      data: {
        assemblies: 1,
        totals: { present: 6, absent: 1, justified: 1 },
        data: [{
          id: 4,
          title: 'Asamblea ordinaria',
          date: assembly.date,
          status: 'COMPLETED',
          convokedCount: 8,
          denominatorAvailable: true,
          present: 6,
          absent: 1,
          justified: 1,
          unrecorded: 0,
          attendancePercentage: 75,
        }],
      },
    },
    refetch: vi.fn(),
  } as never)
})

describe('AssembliesReportPanel', () => {
  it('shows real status, convocation and attendance data', () => {
    render(<AssembliesReportPanel />)

    expect(screen.getByRole('heading', { name: 'Reporte de asambleas' })).toBeInTheDocument()
    expect(screen.getByText('Asamblea ordinaria')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Ordinaria')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('8', { selector: 'td' })).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Finalizada')).toBeInTheDocument()
  })

  it('applies supported filters to the existing paginated assembly query', async () => {
    render(<AssembliesReportPanel />)
    fireEvent.change(screen.getByLabelText('Buscar título o lugar'), {
      target: { value: '  asamblea  ' },
    })
    fireEvent.change(screen.getByLabelText('Estado'), {
      target: { value: 'SCHEDULED' },
    })
    fireEvent.change(screen.getByLabelText('Tipo'), {
      target: { value: 'EXTRAORDINARY' },
    })
    fireEvent.change(screen.getByLabelText('Fecha desde'), {
      target: { value: '2026-01-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() =>
      expect(useAssemblies).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'asamblea',
          status: 'SCHEDULED',
          type: 'EXTRAORDINARY',
          dateFrom: expect.stringContaining('2026-01-01'),
          page: 1,
          limit: 20,
        }),
      ),
    )
  })

  it('rejects reversed dates without querying a changed filter', () => {
    render(<AssembliesReportPanel />)
    fireEvent.change(screen.getByLabelText('Fecha desde'), {
      target: { value: '2026-12-31' },
    })
    fireEvent.change(screen.getByLabelText('Fecha hasta'), {
      target: { value: '2026-01-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'La fecha inicial no puede ser posterior a la fecha final.',
    )
    expect(useAssemblies).toHaveBeenLastCalledWith({ page: 1, limit: 20 })
  })
})
