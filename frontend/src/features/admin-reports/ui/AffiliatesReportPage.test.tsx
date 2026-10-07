import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminReportsApi } from '../api/adminReports.api'
import type { AffiliateReportResponse } from '../model/adminReports.types'
import { AffiliatesReportPage } from './AffiliatesReportPage'

vi.mock('../api/adminReports.api', () => ({
  adminReportsApi: {
    getAffiliates: vi.fn(),
    exportAffiliates: vi.fn(),
  },
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
)
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
)

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  if (originalCreateObjectURL) {
    Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL)
  } else {
    Reflect.deleteProperty(URL, 'createObjectURL')
  }
  if (originalRevokeObjectURL) {
    Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL)
  } else {
    Reflect.deleteProperty(URL, 'revokeObjectURL')
  }
})

function response(
  data: AffiliateReportResponse['data']['data'] = [],
): AffiliateReportResponse {
  return {
    metadata: {
      generatedAt: '2026-10-06T12:00:00.000Z',
      generatedBy: null,
      period: { from: null, to: null },
      appliedFilters: {},
      dataSource: 'AFFILIATE',
      reportVersion: '1.0',
    },
    data: { data, total: data.length, page: 1, limit: 20 },
  }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AffiliatesReportPage />
    </QueryClientProvider>,
  )
}

describe('AffiliatesReportPage', () => {
  it('shows report fields and distinguishes affiliate status from subscription validity', async () => {
    vi.mocked(adminReportsApi.getAffiliates).mockResolvedValue(
      response([
        {
          id: 5,
          fullName: 'Ana Pérez',
          identification: '101010101',
          affiliateType: 'Asociado',
          affiliationDate: '2025-01-01T00:00:00.000Z',
          affiliateStatus: 'ACTIVE',
          subscriptionExpirationDate: '2026-10-07T12:00:00.000Z',
          subscriptionStatus: 'CURRENT',
          daysRemaining: 1,
        },
        {
          id: 6,
          fullName: 'Luis Mora',
          identification: '202020202',
          affiliateType: null,
          affiliationDate: '2024-01-01T00:00:00.000Z',
          affiliateStatus: 'INACTIVE',
          subscriptionExpirationDate: null,
          subscriptionStatus: 'UNSPECIFIED',
          daysRemaining: null,
        },
      ]),
    )

    renderPage()

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('101010101')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Vigente')).toBeInTheDocument()
    expect(
      within(screen.getByRole('table')).getByText('Sin vencimiento registrado'),
    ).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Inactivo')).toBeInTheDocument()
    expect(screen.getByText('1', { selector: 'td' })).toBeInTheDocument()
  })

  it('sends applied filters to the server instead of filtering only visible rows', async () => {
    vi.mocked(adminReportsApi.getAffiliates).mockResolvedValue(response())

    renderPage()

    fireEvent.change(screen.getByLabelText('Nombre o identificación'), {
      target: { value: '  Ana Pérez  ' },
    })
    fireEvent.change(screen.getByLabelText('Tipo de afiliado'), {
      target: { value: 'Asociado' },
    })
    fireEvent.change(screen.getByLabelText('Estado del afiliado'), {
      target: { value: 'ACTIVE' },
    })
    fireEvent.change(screen.getByLabelText('Vigencia'), {
      target: { value: 'CURRENT' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() =>
      expect(adminReportsApi.getAffiliates).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'Ana Pérez',
          affiliateType: 'Asociado',
          affiliateStatus: 'ACTIVE',
          subscriptionStatus: 'CURRENT',
          page: 1,
          limit: 20,
        }),
      ),
    )
  })

  it('rejects a reversed date range before requesting the report', async () => {
    vi.mocked(adminReportsApi.getAffiliates).mockResolvedValue(response())

    renderPage()
    fireEvent.change(screen.getByLabelText('Afiliación desde'), {
      target: { value: '2026-12-01' },
    })
    fireEvent.change(screen.getByLabelText('Afiliación hasta'), {
      target: { value: '2026-01-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La fecha inicial no puede ser posterior a la fecha final.',
    )
    expect(adminReportsApi.getAffiliates).toHaveBeenCalledTimes(1)
  })

  it('exports the applied filters and downloads the CSV while showing loading state', async () => {
    const blob = new Blob(['csv'], { type: 'text/csv' })
    let resolveExport!: (value: Blob) => void
    vi.mocked(adminReportsApi.exportAffiliates).mockReturnValue(
      new Promise((resolve) => {
        resolveExport = resolve
      }),
    )
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:affiliate-report'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toMatch(
          /^Reporte_Afiliados_Membresias_\d{4}-\d{2}-\d{2}\.csv$/,
        )
      })

    vi.mocked(adminReportsApi.getAffiliates).mockResolvedValue(response())
    renderPage()
    fireEvent.change(screen.getByLabelText('Nombre o identificación'), {
      target: { value: 'Ana Pérez' },
    })
    fireEvent.change(screen.getByLabelText('Vigencia'), {
      target: { value: 'CURRENT' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() =>
      expect(adminReportsApi.getAffiliates).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Ana Pérez', subscriptionStatus: 'CURRENT' }),
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    expect(
      screen.getByRole('button', { name: /Exportando CSV/ }),
    ).toBeDisabled()
    expect(adminReportsApi.exportAffiliates).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'Ana Pérez',
        subscriptionStatus: 'CURRENT',
        page: 1,
        limit: 20,
      }),
    )

    resolveExport(blob)
    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:affiliate-report')
  })

  it('reports export errors to the user', async () => {
    const { toast } = await import('sonner')
    vi.mocked(adminReportsApi.getAffiliates).mockResolvedValue(response())
    vi.mocked(adminReportsApi.exportAffiliates).mockRejectedValue(
      new Error('offline'),
    )

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'No fue posible exportar el reporte de afiliados.',
      ),
    )
  })
})
