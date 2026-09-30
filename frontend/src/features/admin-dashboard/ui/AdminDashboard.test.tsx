import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

function renderDashboard(permissionCodes?: readonly string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<MemoryRouter><QueryClientProvider client={client}><AdminDashboard permissionCodes={permissionCodes} /></QueryClientProvider></MemoryRouter>)
}

function withoutAttentionData() {
  return {
    ...data,
    affiliateRequests: { pending: 0 },
    justifications: { pending: 0 },
    reservations: { ...data.reservations, pending: 0 },
    inventory: { ...data.inventory, lowStockItems: 0, outOfStockItems: 0, overdueLoans: 0 },
  }
}

const attentionCases = [
  { label: 'Artículos agotados', set: (value: number) => ({ ...withoutAttentionData(), inventory: { ...withoutAttentionData().inventory, outOfStockItems: value } }) },
  { label: 'Préstamos vencidos', set: (value: number) => ({ ...withoutAttentionData(), inventory: { ...withoutAttentionData().inventory, overdueLoans: value } }) },
  { label: 'Artículos con stock bajo', set: (value: number) => ({ ...withoutAttentionData(), inventory: { ...withoutAttentionData().inventory, lowStockItems: value } }) },
  { label: 'Solicitudes de afiliación', set: (value: number) => ({ ...withoutAttentionData(), affiliateRequests: { pending: value } }) },
  { label: 'Justificaciones de ausencia', set: (value: number) => ({ ...withoutAttentionData(), justifications: { pending: value } }) },
  { label: 'Reservas', set: (value: number) => ({ ...withoutAttentionData(), reservations: { ...withoutAttentionData().reservations, pending: value } }) },
] as const

const institutionalPanoramaMetrics = [
  ['Afiliados', '12'],
  ['Afiliados inactivos', '3'],
  ['Reservas totales', '6'],
  ['Reservas aprobadas', '1'],
  ['Reservas confirmadas', '2'],
  ['Artículos de inventario', '20'],
  ['Préstamos activos', '4'],
  ['Asambleas programadas', '2'],
  ['Asambleas en progreso', '1'],
  ['Asambleas completadas', '4'],
  ['Donaciones registradas', '7'],
  ['Donaciones confirmadas', '6'],
] as const

const panoramaContractData = {
  ...data,
  affiliates: { total: 101, active: 9, inactive: 102 },
  reservations: { total: 103, pending: 2, approved: 104, rejected: 0, cancelled: 0, confirmed: 105, completed: 1 },
  donations: { total: 110, confirmed: 111, cancelled: 1 },
  inventory: { totalItems: 106, lowStockItems: 3, outOfStockItems: 1, activeLoans: 107, overdueLoans: 2 },
  assemblies: { total: 7, scheduled: 108, in_progress: 109, completed: 112, cancelled: 0 },
}

const panoramaContractMetrics = [
  ['Afiliados', '101'],
  ['Afiliados inactivos', '102'],
  ['Reservas totales', '103'],
  ['Reservas aprobadas', '104'],
  ['Reservas confirmadas', '105'],
  ['Artículos de inventario', '106'],
  ['Préstamos activos', '107'],
  ['Asambleas programadas', '108'],
  ['Asambleas en progreso', '109'],
  ['Asambleas completadas', '112'],
  ['Donaciones registradas', '110'],
  ['Donaciones confirmadas', '111'],
] as const

const quickActionCases = [
  { capability: 'adm.requests.read', label: 'Revisar solicitudes', path: '/app/admin/requests' },
  { capability: 'res.reservations.read', label: 'Gestionar reservas', path: '/app/reservations' },
  { capability: 'usr.users.read', label: 'Gestionar usuarios', path: '/admin/users' },
] as const

afterEach(() => {
  vi.mocked(httpClient.get).mockReset()
})

describe('AdminDashboard', () => {
  it('shows a loading state while requesting real indicators', () => {
    vi.mocked(httpClient.get).mockReturnValue(new Promise(() => {}))
    renderDashboard()

    expect(screen.getByLabelText('Cargando indicadores administrativos')).toBeInTheDocument()
  })

  it('keeps V1 dashboard content while omitting legacy financial and duplicate activity content', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard()

    expect(screen.getByRole('heading', { name: 'Resumen general' })).toBeInTheDocument()
    expect(await screen.findByText('Afiliados activos')).toBeInTheDocument()
    const summary = screen.getByRole('region', { name: 'Resumen general' })
    const summaryMetrics = within(summary).getAllByRole('article')
    expect(summaryMetrics).toHaveLength(4)
    ;[
      ['Solicitudes pendientes', '4'],
      ['Justificaciones pendientes', '2'],
      ['Reservas pendientes', '2'],
      ['Afiliados activos', '9'],
    ].forEach(([label, value], index) => {
      expect(within(summaryMetrics[index]).getByText(label)).toBeInTheDocument()
      expect(within(summaryMetrics[index]).getByText(value)).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Atención requerida' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Actividad' })).toBeInTheDocument()
    expect(screen.getByText('Serie temporal no disponible')).toBeInTheDocument()
    const panorama = screen.getByRole('region', { name: 'Panorama institucional' })
    const panoramaCards = within(panorama).getAllByRole('article')
    expect(panoramaCards).toHaveLength(12)
    institutionalPanoramaMetrics.forEach(([label, value], index) => {
      expect(within(panoramaCards[index]).getByText(label)).toBeInTheDocument()
      expect(within(panoramaCards[index]).getByText(value)).toBeInTheDocument()
    })
    expect(screen.getByText('Artículos con stock bajo')).toBeInTheDocument()
    const outOfStockRisk = screen.getByText('Artículos agotados')
    const overdueLoanRisk = screen.getByText('Préstamos vencidos')
    const lowStockRisk = screen.getByText('Artículos con stock bajo')
    expect(outOfStockRisk.compareDocumentPosition(overdueLoanRisk) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(overdueLoanRisk.compareDocumentPosition(lowStockRisk) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Actividad reciente' })).toBeInTheDocument()
    expect(screen.getByText('Actividad reciente no disponible')).toBeInTheDocument()
    expect(screen.getByText(/no incluye eventos operativos ni su cronología/i)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Actividad' })).toHaveLength(1)
    expect(screen.getAllByRole('heading', { name: 'Actividad reciente' })).toHaveLength(1)
    expect(screen.queryByRole('heading', { name: 'Cola operativa' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Resumen financiero acumulado' })).not.toBeInTheDocument()
    expect(screen.queryByText('Ingresos')).not.toBeInTheDocument()
    expect(screen.queryByText('Egresos')).not.toBeInTheDocument()
    expect(screen.queryByText('Balance')).not.toBeInTheDocument()
    expect(httpClient.get).toHaveBeenCalledWith('/admin-reports/dashboard')
  })

  it('preserves all 12 institutional panorama labels and their dashboard contract values', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { ...response, data: panoramaContractData } })
    renderDashboard()

    const panorama = await screen.findByRole('region', { name: 'Panorama institucional' })
    const panoramaCards = within(panorama).getAllByRole('article')
    expect(panoramaCards).toHaveLength(12)
    panoramaContractMetrics.forEach(([label, value], index) => {
      expect(within(panoramaCards[index]).getByText(label)).toBeInTheDocument()
      expect(within(panoramaCards[index]).getByText(value)).toBeInTheDocument()
    })
  })

  it.each(attentionCases)('renders only $label when its contract condition is positive', async ({ label, set }) => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { ...response, data: set(1) } })
    renderDashboard()

    const attention = await screen.findByRole('region', { name: 'Atención requerida' })
    expect(within(attention).getByRole('heading', { level: 4, name: label })).toBeInTheDocument()
    expect(within(attention).getAllByRole('heading', { level: 4 })).toHaveLength(1)
  })

  it.each(attentionCases)('omits $label when its contract condition is zero', async ({ label, set }) => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { ...response, data: set(0) } })
    renderDashboard()

    const attention = await screen.findByRole('region', { name: 'Atención requerida' })
    expect(within(attention).queryByRole('heading', { level: 4, name: label })).not.toBeInTheDocument()
    expect(within(attention).getByText('No hay pendientes de atención.')).toBeInTheDocument()
  })

  it('keeps genuine attention items visible without session permissions but hides contextual actions', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard([])

    const attention = await screen.findByRole('region', { name: 'Atención requerida' })
    expect(within(attention).getAllByRole('heading', { level: 4 })).toHaveLength(6)
    attentionCases.forEach(({ label }) => expect(within(attention).getByRole('heading', { level: 4, name: label })).toBeInTheDocument())
    expect(within(attention).queryAllByRole('link')).toHaveLength(0)
  })

  it('shows contextual actions only for available route capabilities', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard(['inv.inventory.read', 'adm.requests.read'])

    expect((await screen.findAllByRole('link', { name: 'Ver alertas' })).every((link) => link.getAttribute('href') === '/inventory/alerts')).toBe(true)
    expect(screen.getByRole('link', { name: 'Revisar' })).toHaveAttribute('href', '/app/admin/requests')
    expect(screen.getByRole('link', { name: 'Ver préstamos' })).toHaveAttribute('href', '/inventory/loans')
    const justifications = screen.getByText('Justificaciones de ausencia').closest('[data-slot="card"]')
    expect(justifications).not.toBeNull()
    expect(within(justifications!).queryByRole('link', { name: 'Revisar' })).not.toBeInTheDocument()
  })

  it.each(quickActionCases)('shows $label only with $capability and routes it to $path', async ({ capability, label, path }) => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard([capability])

    const actions = await screen.findByRole('navigation', { name: 'Accesos rápidos administrativos' })
    expect(within(actions).getByRole('link', { name: new RegExp(label, 'i') })).toHaveAttribute('href', path)
    expect(within(actions).getAllByRole('link')).toHaveLength(1)
  })

  it('does not expose quick actions when no route capability is available', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard([])

    expect(screen.queryByRole('navigation', { name: 'Accesos rápidos administrativos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Accesos rápidos' })).not.toBeInTheDocument()
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
