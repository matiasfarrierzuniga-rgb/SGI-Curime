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
  ['Afiliación', 'Afiliados registrados', '12'],
  ['Afiliación', 'Afiliados inactivos', '3'],
  ['Reservas', 'Total', '6'],
  ['Reservas', 'Aprobadas', '1'],
  ['Reservas', 'Confirmadas', '2'],
  ['Inventario y préstamos', 'Artículos', '20'],
  ['Inventario y préstamos', 'Préstamos activos', '4'],
  ['Asambleas', 'Programadas', '2'],
  ['Asambleas', 'En progreso', '1'],
  ['Asambleas', 'Completadas', '4'],
  ['Donaciones', 'Registradas', '7'],
  ['Donaciones', 'Confirmadas', '6'],
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
  ['Afiliación', 'Afiliados registrados', '101'],
  ['Afiliación', 'Afiliados inactivos', '102'],
  ['Reservas', 'Total', '103'],
  ['Reservas', 'Aprobadas', '104'],
  ['Reservas', 'Confirmadas', '105'],
  ['Inventario y préstamos', 'Artículos', '106'],
  ['Inventario y préstamos', 'Préstamos activos', '107'],
  ['Asambleas', 'Programadas', '108'],
  ['Asambleas', 'En progreso', '109'],
  ['Asambleas', 'Completadas', '112'],
  ['Donaciones', 'Registradas', '110'],
  ['Donaciones', 'Confirmadas', '111'],
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

  it('keeps real V1 dashboard content while omitting financial and unavailable activity placeholders', async () => {
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
    const panorama = screen.getByRole('region', { name: 'Panorama institucional' })
    expect(within(panorama).getAllByRole('heading', { level: 4 })).toHaveLength(5)
    institutionalPanoramaMetrics.forEach(([group, label, value]) => {
      const card = within(panorama).getByRole('heading', { level: 4, name: group }).closest('[data-slot="card"]')
      expect(card).not.toBeNull()
      expect(within(card!).getByText(label)).toBeInTheDocument()
      expect(within(card!).getByText(value)).toBeInTheDocument()
    })
    expect(screen.getByText('Artículos con stock bajo')).toBeInTheDocument()
    const outOfStockRisk = screen.getByText('Artículos agotados')
    const overdueLoanRisk = screen.getByText('Préstamos vencidos')
    const lowStockRisk = screen.getByText('Artículos con stock bajo')
    expect(outOfStockRisk.compareDocumentPosition(overdueLoanRisk) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(overdueLoanRisk.compareDocumentPosition(lowStockRisk) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Actividad' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Actividad reciente' })).not.toBeInTheDocument()
    expect(screen.queryByText(/no disponible|fuente.*pendiente/i)).not.toBeInTheDocument()
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
    expect(within(panorama).getAllByRole('heading', { level: 4 })).toHaveLength(5)
    panoramaContractMetrics.forEach(([group, label, value]) => {
      const card = within(panorama).getByRole('heading', { level: 4, name: group }).closest('[data-slot="card"]')
      expect(card).not.toBeNull()
      expect(within(card!).getByText(label)).toBeInTheDocument()
      expect(within(card!).getByText(value)).toBeInTheDocument()
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
    expect(within(attention).getByText('Todo está al día.')).toBeInTheDocument()
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

    const actions = await screen.findByRole('navigation', { name: 'Acciones prioritarias administrativas' })
    expect(within(actions).getByRole('link', { name: new RegExp(label, 'i') })).toHaveAttribute('href', path)
    expect(within(actions).getAllByRole('link')).toHaveLength(1)
  })

  it('does not expose quick actions when no route capability is available', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: response })
    renderDashboard([])

    expect(screen.queryByRole('navigation', { name: 'Acciones prioritarias administrativas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Acciones prioritarias' })).not.toBeInTheDocument()
  })

  it('shows an accessible error state', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error('network'))
    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar los indicadores')
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument()
  })

  it('renders real zero values and a positive attention state when every source is zero', async () => {
    const empty = JSON.parse(JSON.stringify(data)) as typeof data
    for (const section of Object.values(empty)) {
      for (const key of Object.keys(section)) {
        if (key === 'currency') continue
        ;(section as Record<string, string | number>)[key] = typeof (section as Record<string, string | number>)[key] === 'string' ? '0.00' : 0
      }
    }
    vi.mocked(httpClient.get).mockResolvedValue({ data: { ...response, data: empty } })
    renderDashboard()

    const summary = await screen.findByRole('region', { name: 'Resumen general' })
    expect(within(summary).getAllByRole('article')).toHaveLength(4)
    expect(within(summary).getAllByText('0')).toHaveLength(4)
    expect(screen.getByRole('region', { name: 'Panorama institucional' })).toBeInTheDocument()
    expect(screen.getByText('Todo está al día.')).toBeInTheDocument()
    expect(screen.queryByText('Aún no hay datos administrativos para mostrar.')).not.toBeInTheDocument()
  })
})
