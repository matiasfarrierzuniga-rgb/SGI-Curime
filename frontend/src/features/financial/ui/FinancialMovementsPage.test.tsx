import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { useFinancialMovementDetail, useFinancialMovementsList, useFinancialMovementSummary } from '../hooks/useFinancial'
import { FinancialMovementsPage } from './FinancialMovementsPage'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useFinancial', () => ({ useFinancialMovementsList: vi.fn(), useFinancialMovementSummary: vi.fn(), useFinancialMovementDetail: vi.fn(), useCreateFinancialMovement: vi.fn() }))

const movement = { id: 3, type: 'INCOME', source: 'MANUAL', amount: '1500.00', currency: 'CRC', description: 'Venta de comidas', reference: null, occurredAt: '2030-01-01T12:00:00.000Z', sourceId: null, recordedById: 7, createdAt: '2030-01-01T12:00:00.000Z', updatedAt: '2030-01-01T12:00:00.000Z' } as const

describe('FinancialMovementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Tesorero' } } as never)
    vi.mocked(useFinancialMovementsList).mockReturnValue({ isPending: false, isError: false, data: { data: [movement], total: 1, page: 1, limit: 20 } } as never)
    vi.mocked(useFinancialMovementSummary).mockReturnValue({ isPending: false, isError: false, data: { currency: 'CRC', totalIncome: '1500.00', totalExpenses: '0.00', balance: '1500.00' } } as never)
    vi.mocked(useFinancialMovementDetail).mockReturnValue({ isPending: false, isError: false, data: { ...movement, recordedBy: { id: 7, fullName: 'Ana Pérez' } } } as never)
  })

  it('renders movement list, summary, supported filters, and detail action', () => {
    render(<FinancialMovementsPage />)
    expect(screen.getByText('Venta de comidas')).toBeInTheDocument()
    expect(screen.getByText('Ingresos')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'INCOME' } })
    expect(useFinancialMovementsList).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'INCOME', page: 1, limit: 20 }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))
    expect(useFinancialMovementDetail).toHaveBeenLastCalledWith(3)
  })

  it('renders loading, error, and empty list states', () => {
    vi.mocked(useFinancialMovementsList).mockReturnValue({ isPending: true, isError: false } as never)
    const { rerender } = render(<FinancialMovementsPage />)
    expect(screen.getByText('Cargando movimientos financieros...')).toBeInTheDocument()
    vi.mocked(useFinancialMovementsList).mockReturnValue({ isPending: false, isError: true, error: new Error('falló') } as never)
    rerender(<FinancialMovementsPage />)
    expect(screen.getByText('No fue posible cargar los movimientos')).toBeInTheDocument()
    vi.mocked(useFinancialMovementsList).mockReturnValue({ isPending: false, isError: false, data: { data: [], total: 0, page: 1, limit: 20 } } as never)
    rerender(<FinancialMovementsPage />)
    expect(screen.getByText('No hay movimientos financieros')).toBeInTheDocument()
  })

  it('hides manual registration without create capability', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Gestor de Inventario' } } as never)
    render(<FinancialMovementsPage />)
    expect(screen.queryByRole('button', { name: 'Registrar movimiento' })).not.toBeInTheDocument()
  })
})
