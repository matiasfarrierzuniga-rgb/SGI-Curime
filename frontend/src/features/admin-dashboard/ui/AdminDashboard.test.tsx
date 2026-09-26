import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminDashboard } from '@/features/admin-dashboard'
import { httpClient } from '@/shared/api/httpClient'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn() } }))

const data = {
  affiliates: { total: 12, active: 9, inactive: 3 },
  affiliateRequests: { pending: 4 },
  reservations: { total: 6, pending: 2, approved: 1, rejected: 0, cancelled: 0, confirmed: 2, completed: 1 },
  financial: { currency: 'CRC', totalIncome: '150000.00', totalExpenses: '40000.00', balance: '110000.00' },
  donations: { total: 7, confirmed: 6, cancelled: 1 },
  inventory: { totalItems: 20, lowStockItems: 3, outOfStockItems: 1, activeLoans: 4, overdueLoans: 2 },
  assemblies: { total: 7, scheduled: 2, in_progress: 1, completed: 4, cancelled: 0 },
  justifications: { pending: 2 },
}

const response = {
  metadata: { generatedAt: '2026-09-14T12:00:00.000Z', generatedBy: { id: 1, fullName: 'Admin' }, period: { from: null, to: null }, appliedFilters: {}, dataSource: ['AFFILIATE'], reportVersion: '1.0' },
  data,
}

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><AdminDashboard /></QueryClientProvider>)
}

describe('AdminDashboard', () => {
  it('shows a loading state while requesting real indicators', () => {
    vi.mocked(httpClient.get).mockReturnValue(new Promise(() => {}))
    renderDashboard()

    expect(screen.getByLabelText('Cargando indicadores administrativos')).toBeInTheDocument()
  })

  it('groups every displayed metric into queue, attention, snapshot, and financial summaries', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard()

    expect(await screen.findByRole('heading', { name: 'Cola operativa' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Atención requerida' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Panorama institucional' })).toBeInTheDocument()
    expect(await screen.findByText('Afiliados activos')).toBeInTheDocument()
    expect(screen.getByText('Reservas confirmadas')).toBeInTheDocument()
    expect(screen.getByText('Artículos con stock bajo')).toBeInTheDocument()
    const outOfStockRisk = screen.getByText('Artículos agotados')
    const overdueLoanRisk = screen.getByText('Préstamos vencidos')
    const lowStockRisk = screen.getByText('Artículos con stock bajo')
    expect(outOfStockRisk.compareDocumentPosition(overdueLoanRisk) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(overdueLoanRisk.compareDocumentPosition(lowStockRisk) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('Asambleas en progreso')).toBeInTheDocument()
    expect(screen.getByText('Donaciones confirmadas')).toBeInTheDocument()
    expect(screen.getByText('₡110 000,00')).toBeInTheDocument()
    expect(screen.getByText(/donaciones ya incluidas como ingresos no se suman nuevamente/i)).toBeInTheDocument()
    expect(httpClient.get).toHaveBeenCalledWith('/admin-reports/dashboard')
  })

  it('omits zero-valued attention metrics and confirms the absence of operational risks', async () => {
    const withoutRisks = { ...data, inventory: { ...data.inventory, lowStockItems: 0, outOfStockItems: 0, overdueLoans: 0 } }
    vi.mocked(httpClient.get).mockResolvedValue({ data: { ...response, data: withoutRisks } })
    renderDashboard()

    expect(await screen.findByText('No hay alertas de inventario ni préstamos vencidos.')).toBeInTheDocument()
    expect(screen.queryByText('Artículos con stock bajo')).not.toBeInTheDocument()
    expect(screen.queryByText('Artículos agotados')).not.toBeInTheDocument()
    expect(screen.queryByText('Préstamos vencidos')).not.toBeInTheDocument()
  })

  it('shows an accessible error state', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error('network'))
    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar los indicadores')
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument()
  })

  it('shows a clear empty state when every source is empty', async () => {
    const empty = JSON.parse(JSON.stringify(data)) as typeof data
    for (const section of Object.values(empty)) {
      for (const key of Object.keys(section)) {
        if (key === 'currency') continue
        ;(section as Record<string, string | number>)[key] = typeof (section as Record<string, string | number>)[key] === 'string' ? '0.00' : 0
      }
    }
    vi.mocked(httpClient.get).mockResolvedValue({ data: { ...response, data: empty } })
    renderDashboard()

    expect(await screen.findByText('Aún no hay datos administrativos para mostrar.')).toBeInTheDocument()
  })
})
