import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    fie: {
      entries: [
        { id: 1, description: 'Entrada ficticia', amount: '25000.50', occurredAt: '2026-02-01T12:00:00.000Z', source: 'MANUAL' },
        { id: 2, description: 'Donación ficticia uno', amount: '20000.00', occurredAt: '2026-02-02T12:00:00.000Z', source: 'DONATION' },
        { id: 3, description: 'Donación ficticia dos', amount: '30000.00', occurredAt: '2026-02-03T12:00:00.000Z', source: 'DONATION' },
      ],
      exits: [{ id: 4, description: 'Salida ficticia', amount: '10000.00', occurredAt: '2026-03-01T12:00:00.000Z', source: 'MANUAL' }],
      capacity: { entryCount: 3, exitCount: 1, entryCapacity: 15, exitCapacity: 15, entryOverflow: false, exitOverflow: false },
      totalIncomePlusOpeningBalance: '200000.50',
      totalExpensesPlusClosingBalance: '200000.50',
    },
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
    expect(screen.getAllByText('₡125 000,00')).toHaveLength(2)
    expect(screen.getAllByText('₡190 000,50')).toHaveLength(2)
    expect(screen.getAllByText('Donación')).toHaveLength(3)
    expect(screen.getByText('Persona Tesorera')).toBeInTheDocument()
    expect(screen.getByText(/1 de enero de 2026.*31 de diciembre de 2026/)).toBeInTheDocument()
    expect(screen.getByText(/todavía no clasifica cuentas, folios ni un catálogo contable DINADECO/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Preparación del FIE' })).toBeInTheDocument()
    expect(screen.getByText('Saldo inicial derivado')).toBeInTheDocument()
    expect(screen.getByText('Saldo final derivado')).toBeInTheDocument()
    expect(screen.getByText('Total entradas')).toBeInTheDocument()
    expect(screen.getByText('Total salidas')).toBeInTheDocument()
    expect(screen.getByText('Total entradas + saldo inicial')).toBeInTheDocument()
    expect(screen.getByText('Total salidas + saldo final')).toBeInTheDocument()
    expect(screen.getAllByText('₡200 000,50')).toHaveLength(2)
    const entries = screen.getByRole('table', { name: 'Detalle de entradas para preparar el FIE' })
    expect(within(entries).getByText('Entrada ficticia')).toBeInTheDocument()
    expect(within(entries).getByText('₡25 000,50')).toBeInTheDocument()
    expect(within(entries).getByText('Manual')).toBeInTheDocument()
    expect(within(entries).getAllByRole('columnheader')).toHaveLength(4)
    expect(within(screen.getByRole('table', { name: 'Detalle de salidas para preparar el FIE' })).getByText('Salida ficticia')).toBeInTheDocument()
    expect(screen.getByText('3 de 15 movimientos de entrada')).toBeInTheDocument()
    expect(screen.getByText('1 de 15 movimientos de salida')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/No existe conciliación bancaria.*caja física de cuentas bancarias/)).toBeInTheDocument()
    expect(screen.getByText(/datos institucionales.*pendientes de captura o validación manual/)).toBeInTheDocument()
  })

  it.each(['entries', 'exits'] as const)('shows overflow without hiding any of the 16 %s', async (direction) => {
    const fixture = structuredClone(response)
    fixture.data.fie[direction] = Array.from({ length: 16 }, (_, index) => ({ ...response.data.fie[direction][0], id: index + 1, description: `Movimiento ficticio ${index + 1}` }))
    const isEntry = direction === 'entries'
    fixture.data.fie.capacity = { entryCount: isEntry ? 16 : 3, exitCount: isEntry ? 1 : 16, entryCapacity: 15, exitCapacity: 15, entryOverflow: isEntry, exitOverflow: !isEntry }
    vi.mocked(httpClient.get).mockResolvedValue({ data: fixture })
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent(`todos los movimientos de ${isEntry ? 'entrada' : 'salida'}`)
    expect(screen.getByText(`16 de 15 movimientos de ${isEntry ? 'entrada' : 'salida'}`)).toBeInTheDocument()
    expect(screen.getByText(/no consolida ni omite movimientos automáticamente/)).toBeInTheDocument()
    expect(within(screen.getByRole('table', { name: `Detalle de ${isEntry ? 'entradas' : 'salidas'} para preparar el FIE` })).getAllByRole('row')).toHaveLength(17)
    expect(screen.getByText('Movimiento ficticio 16')).toBeInTheDocument()
  })

  it('shows capacity 15 without overflow and handles an empty exits list', async () => {
    const fixture = structuredClone(response)
    fixture.data.fie.entries = Array.from({ length: 15 }, (_, index) => ({ ...response.data.fie.entries[0], id: index + 1 }))
    fixture.data.fie.exits = []
    fixture.data.fie.capacity.entryCount = 15
    fixture.data.fie.capacity.exitCount = 0
    vi.mocked(httpClient.get).mockResolvedValue({ data: fixture })
    renderPage()
    expect(await screen.findByText('15 de 15 movimientos de entrada')).toBeInTheDocument()
    expect(screen.getByText('0 de 15 movimientos de salida')).toBeInTheDocument()
    expect(screen.getByText('No se registraron movimientos de salida en el período.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
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
