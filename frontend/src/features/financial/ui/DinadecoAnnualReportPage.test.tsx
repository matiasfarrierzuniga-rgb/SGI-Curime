import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { DinadecoAnnualReportPage } from './DinadecoAnnualReportPage'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn() } }))

const currentYear = new Date().getFullYear()
const response = {
  metadata: {
    generatedAt: '2026-09-15T14:30:00.000Z',
    generatedBy: { id: 7, fullName: 'Persona Tesorera' },
    period: { from: '2026-01-01T00:00:00.000Z', to: '2027-01-01T00:00:00.000Z' },
    appliedFilters: { year: 2026 },
    dataSource: 'FINANCIAL_MOVEMENT',
    reportVersion: '1.0',
  },
  data: {
    year: 2026,
    currency: 'CRC',
    openingBalance: '125000.00',
    income: { total: '75000.50', count: 3, bySource: { MANUAL: { total: '25000.50', count: 1 }, DONATION: { total: '50000.00', count: 2 } } },
    expenses: { total: '10000.00', count: 1, bySource: { MANUAL: { total: '10000.00', count: 1 } } },
    netMovement: '65000.50',
    closingBalance: '190000.50',
    movementCount: 4,
  },
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><DinadecoAnnualReportPage /></QueryClientProvider>)
}

describe('DinadecoAnnualReportPage', () => {
  it('renders the initial loading state for the current year', () => {
    vi.mocked(httpClient.get).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('heading', { name: 'Informe Económico DINADECO' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(`Cargando informe económico ${currentYear}`)
  })

  it('shows real balances, source breakdown, metadata, and the accounting limitation', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderPage()

    expect(await screen.findByText('Saldo anterior')).toBeInTheDocument()
    expect(screen.getByText('₡125 000,00')).toBeInTheDocument()
    expect(screen.getByText('₡190 000,50')).toBeInTheDocument()
    expect(screen.getByText('Donación')).toBeInTheDocument()
    expect(screen.getByText('Persona Tesorera')).toBeInTheDocument()
    expect(screen.getByText(/1 de enero de 2026.*31 de diciembre de 2026/)).toBeInTheDocument()
    expect(screen.getByText(/todavía no clasifica cuentas, folios ni un catálogo contable DINADECO/i)).toBeInTheDocument()
  })

  it('requests a new query when the year changes', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderPage()
    await screen.findByText('Saldo anterior')

    fireEvent.change(screen.getByLabelText('Año'), { target: { value: currentYear - 1 } })
    await waitFor(() => expect(httpClient.get).toHaveBeenCalledWith(
      '/financial/reports/dinadeco/annual',
      { params: { year: currentYear - 1 } },
    ))
  })

  it('shows an accessible error state', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error('network'))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar el contenido')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
