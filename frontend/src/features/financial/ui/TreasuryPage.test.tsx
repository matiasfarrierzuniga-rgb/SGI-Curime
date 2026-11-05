import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTreasurySummary } from '../hooks/useFinancial'
import { TreasuryPage } from './TreasuryPage'

vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { permissionCodes: ['fin.movements.read', 'fin.charges.read'] } }) }))
vi.mock('../hooks/useFinancial', () => ({ useTreasurySummary: vi.fn() }))

const data = {
  currency: 'CRC', period: { dateFrom: null, dateTo: null },
  accumulated: { income: '45000.00', expenses: '5000.00', net: '40000.00', bySource: { RESERVATION_PAYMENT: { income: '30000.00', expenses: '0.00', count: 1 }, DONATION: { income: '15000.00', expenses: '0.00', count: 1 }, MANUAL: { income: '0.00', expenses: '5000.00', count: 1 } } },
  currentPeriod: { income: '15000.00', expenses: '5000.00', net: '10000.00', bySource: {} },
  receivables: { pendingCharges: '20000.00', pendingChargeCount: 2 },
  openingBalance: { established: false, amount: null, effectiveAt: null }, registeredBalance: null,
  reconciliation: { reliable: false, reason: 'INCOMPLETE_LINKED_HISTORY_AND_OPENING_BALANCE', issues: ['1 pago(s) confirmado(s) sin movimiento enlazado'], confirmedPayments: '60000.00', confirmedPaymentCount: 2, unlinkedConfirmedPayments: '15000.00', unlinkedConfirmedPaymentCount: 1, unlinkedConfirmedDonationCount: 0 },
} as const

describe('TreasuryPage', () => {
  beforeEach(() => vi.mocked(useTreasurySummary).mockReturnValue({ isPending: false, isError: false, data } as never))

  it('separates registered net, receivables, and unavailable opening balance', () => {
    render(<MemoryRouter><TreasuryPage /></MemoryRouter>)
    expect(screen.getByText('Saldo inicial no establecido')).toBeInTheDocument()
    expect(screen.getByText('Cuentas por cobrar')).toBeInTheDocument()
    expect(screen.getByText('No representa efectivo recibido.')).toBeInTheDocument()
    expect(screen.getByText('1 pago(s) confirmado(s) sin movimiento enlazado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /consultar movimientos/i })).toHaveAttribute('href', '/app/financial/movements')
  })

  it('renders loading and error states independently', () => {
    vi.mocked(useTreasurySummary).mockReturnValue({ isPending: true, isError: false } as never)
    const { rerender } = render(<MemoryRouter><TreasuryPage /></MemoryRouter>)
    expect(screen.getByText('Calculando resumen de tesorería...')).toBeInTheDocument()
    vi.mocked(useTreasurySummary).mockReturnValue({ isPending: false, isError: true, refetch: vi.fn() } as never)
    rerender(<MemoryRouter><TreasuryPage /></MemoryRouter>)
    expect(screen.getByText('No fue posible cargar Tesorería')).toBeInTheDocument()
  })
})
