import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { useFinancialChargeDetail, useFinancialChargesList, useRecordPayment } from '../hooks/useFinancial'
import { FinancialPage } from './FinancialPage'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useFinancial', () => ({ useFinancialChargeDetail: vi.fn(), useFinancialChargesList: vi.fn(), useRecordPayment: vi.fn() }))

const pending = { id: 4, reservationId: 9, amount: '15000.00', currency: 'CRC', status: 'PENDING', createdAt: '2030-01-01T10:00:00.000Z', updatedAt: '2030-01-01T10:00:00.000Z' } as const
const paid = { ...pending, id: 5, reservationId: 10, amount: '200.00', status: 'PAID' } as const
const cancelled = { ...pending, id: 6, reservationId: 11, amount: '50.00', status: 'CANCELLED' } as const
const record = { isPending: false, mutateAsync: vi.fn() }

describe('FinancialPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Administrador' } } as never)
    vi.mocked(useFinancialChargesList).mockReturnValue({ isPending: false, isError: false, data: { data: [pending, paid, cancelled], total: 23, page: 1, limit: 20 } } as never)
    vi.mocked(useFinancialChargeDetail).mockReturnValue({ isPending: false, isError: false, data: { ...pending, payments: [] } } as never)
    vi.mocked(useRecordPayment).mockReturnValue(record as never)
  })

  it('renders loading, error, and empty states', () => {
    vi.mocked(useFinancialChargesList).mockReturnValue({ isPending: true, isError: false } as never)
    const { rerender } = render(<FinancialPage />)
    expect(screen.getByText('Cargando cargos financieros...')).toBeInTheDocument()
    vi.mocked(useFinancialChargesList).mockReturnValue({ isPending: false, isError: true, error: new Error('falló') } as never)
    rerender(<FinancialPage />)
    expect(screen.getByText('No fue posible cargar los cargos financieros')).toBeInTheDocument()
    vi.mocked(useFinancialChargesList).mockReturnValue({ isPending: false, isError: false, data: { data: [], total: 0, page: 1, limit: 20 } } as never)
    rerender(<FinancialPage />)
    expect(screen.getByText('No hay cargos financieros')).toBeInTheDocument()
  })

  it('renders rows with formatted amount, currency, and status badge', () => {
    render(<FinancialPage />)
    const pendingRow = screen.getByRole('row', { name: /#4.*#9.*CRC.*Pendiente/ })
    expect(within(pendingRow).getByText('#4')).toBeInTheDocument()
    expect(within(pendingRow).getByText('#9')).toBeInTheDocument()
    expect(within(pendingRow).getByText('CRC')).toBeInTheDocument()
    expect(within(pendingRow).getByText('Pendiente')).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /#5.*#10.*CRC.*Pagado/ })).getByText('Pagado')).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /#6.*#11.*CRC.*Cancelado/ })).getByText('Cancelado')).toBeInTheDocument()
  })

  it('sends server filters and resets page on filter change', () => {
    render(<FinancialPage />)
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'PENDING' } })
    expect(vi.mocked(useFinancialChargesList)).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PENDING', page: 1, limit: 20 }))
    fireEvent.change(screen.getByLabelText('ID de reserva'), { target: { value: '9' } })
    expect(vi.mocked(useFinancialChargesList)).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PENDING', reservationId: 9, page: 1, limit: 20 }))
  })

  it('uses server pagination while preserving filters and clears all filters', () => {
    render(<FinancialPage />)
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'PENDING' } })
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(vi.mocked(useFinancialChargesList)).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PENDING', page: 2, limit: 20 }))
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(vi.mocked(useFinancialChargesList)).toHaveBeenLastCalledWith({ page: 1, limit: 20 })
  })

  it('shows the record payment action only for pending charges with the capability', () => {
    render(<FinancialPage />)
    expect(screen.getAllByRole('button', { name: 'Registrar pago' })).toHaveLength(1)
  })

  it('allows the treasurer to record payments without checking role names', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Tesorero' } } as never)
    render(<FinancialPage />)
    expect(screen.getAllByRole('button', { name: 'Registrar pago' })).toHaveLength(1)
  })

  it('hides the record payment action without the capability', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'Gestor de Inventario' } } as never)
    render(<FinancialPage />)
    expect(screen.queryByRole('button', { name: 'Registrar pago' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Ver detalle' })).toHaveLength(3)
  })

  it('opens the authoritative charge detail modal', () => {
    render(<FinancialPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    expect(useFinancialChargeDetail).toHaveBeenLastCalledWith(4)
    expect(screen.getByRole('dialog', { name: /cargo financiero #4/i })).toBeInTheDocument()
  })

  it('opens the payment modal from a pending charge row', () => {
    render(<FinancialPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }))
    expect(screen.getByRole('dialog', { name: /registrar pago · cargo #4/i })).toBeInTheDocument()
    expect(useRecordPayment).toHaveBeenCalled()
  })
})
