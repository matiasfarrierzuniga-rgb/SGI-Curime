import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { financialApi } from '../api/financial.api'
import { FinancialDashboardPage } from './FinancialDashboardPage'

const auth = vi.hoisted(() => ({ user: { permissionCodes: ['fin.movements.read', 'fin.charges.read'] as string[] } }))

vi.mock('@/features/auth', () => ({ useAuth: () => auth }))
vi.mock('../api/financial.api', () => ({ financialApi: { getMovementSummary: vi.fn(), listMovements: vi.fn(), listCharges: vi.fn() } }))

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter><FinancialDashboardPage /></MemoryRouter></QueryClientProvider>)
}

describe('FinancialDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.user = { permissionCodes: ['fin.movements.read', 'fin.charges.read'] }
    vi.mocked(financialApi.getMovementSummary).mockResolvedValue({ currency: 'CRC', totalIncome: '1250.50', totalExpenses: '250.25', balance: '1000.25' })
    vi.mocked(financialApi.listMovements).mockResolvedValue({ data: [{ id: 7, type: 'INCOME', source: 'MANUAL', amount: '1250.50', currency: 'CRC', description: 'Aporte comunal', reference: null, occurredAt: '2026-06-01T12:00:00.000Z', sourceId: null, recordedById: 1, createdAt: '', updatedAt: '' }], total: 1, page: 1, limit: 5 })
    vi.mocked(financialApi.listCharges).mockImplementation(async ({ status }) => ({ data: [], total: status === 'PENDING' ? 2 : status === 'PAID' ? 3 : 1, page: 1, limit: 1 }))
  })

  it('renders real authorized movement and charge data', async () => {
    renderDashboard()

    expect(await screen.findByText('Dashboard financiero')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('Aporte comunal').length).toBeGreaterThan(0))
    expect(screen.getByText('Balance registrado')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(financialApi.listCharges).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 1 }))
  })

  it('does not query charges for movement-only access', async () => {
    auth.user = { permissionCodes: ['fin.movements.read'] }
    renderDashboard()

    await screen.findByText('Movimientos recientes')
    await waitFor(() => expect(financialApi.listMovements).toHaveBeenCalled())
    expect(financialApi.listCharges).not.toHaveBeenCalled()
    expect(screen.queryByText('Estado actual de cargos')).not.toBeInTheDocument()
  })
})
