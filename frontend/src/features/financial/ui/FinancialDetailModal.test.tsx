import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFinancialChargeDetail } from '../hooks/useFinancial'
import { FinancialDetailModal } from './FinancialDetailModal'

vi.mock('../hooks/useFinancial', () => ({ useFinancialChargeDetail: vi.fn() }))

const charge = { id: 4, reservationId: 9, amount: '15000.00', balance: '15000.00', currency: 'CRC', status: 'PENDING', dueAt: null, createdAt: '2030-01-01T10:00:00.000Z', updatedAt: '2030-01-01T12:00:00.000Z' } as const
const payment = { id: 1, chargeId: 4, amount: '15000.00', status: 'CONFIRMED', method: 'BANK_TRANSFER', reference: 'REF-1', paidAt: '2030-01-02T09:00:00.000Z', recordedById: 2, createdAt: '2030-01-02T09:00:00.000Z' } as const

describe('FinancialDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useFinancialChargeDetail).mockReturnValue({ isPending: false, isError: false, data: { ...charge, payments: [] } } as never)
  })

  const renderModal = (role: string | null | undefined) => render(<FinancialDetailModal id={4} role={role} onClose={vi.fn()} onRecord={vi.fn()} />)

  it('shows loading state while fetching', () => {
    vi.mocked(useFinancialChargeDetail).mockReturnValue({ isPending: true, isError: false } as never)
    renderModal('Administrador')
    expect(screen.getByText('Cargando detalle del cargo...')).toBeInTheDocument()
  })

  it('shows not-found message for 404', () => {
    vi.mocked(useFinancialChargeDetail).mockReturnValue({ isPending: false, isError: true, error: { response: { status: 404 } }, refetch: vi.fn() } as never)
    renderModal('Administrador')
    expect(screen.getByText('Cargo financiero no encontrado')).toBeInTheDocument()
  })

  it('shows generic error and retry action', () => {
    vi.mocked(useFinancialChargeDetail).mockReturnValue({ isPending: false, isError: true, error: new Error('X'), refetch: vi.fn() } as never)
    renderModal('Administrador')
    expect(screen.getByText('No fue posible cargar el cargo')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
  })

  it('renders charge fields and payment summations', () => {
    vi.mocked(useFinancialChargeDetail).mockReturnValue({ isPending: false, isError: false, data: { ...charge, payments: [] } } as never)
    renderModal('Administrador')
    expect(screen.getByText('Cargo financiero #4')).toBeInTheDocument()
    expect(screen.getByText('#9')).toBeInTheDocument()
    expect(screen.getAllByText('Pendiente')).toHaveLength(2)
    expect(screen.getByText('Sin pagos registrados')).toBeInTheDocument()
  })

  it('renders registered payments', () => {
    vi.mocked(useFinancialChargeDetail).mockReturnValue({ isPending: false, isError: false, data: { ...charge, payments: [payment] } } as never)
    renderModal('Administrador')
    expect(screen.getByText('Transferencia bancaria')).toBeInTheDocument()
    expect(screen.getByText('REF-1')).toBeInTheDocument()
    expect(screen.queryByText('Sin pagos registrados')).not.toBeInTheDocument()
  })

  it('shows record button only for pending charges with capability', () => {
    vi.mocked(useFinancialChargeDetail).mockReturnValue({ isPending: false, isError: false, data: { ...charge, payments: [] } } as never)
    renderModal('Tesorero')
    expect(screen.getByRole('button', { name: 'Registrar pago completo' })).toBeInTheDocument()
  })

  it('hides record button for paid charges', () => {
    vi.mocked(useFinancialChargeDetail).mockReturnValue({ isPending: false, isError: false, data: { ...charge, status: 'PAID', payments: [] } } as never)
    renderModal('Administrador')
    expect(screen.queryByRole('button', { name: 'Registrar pago completo' })).not.toBeInTheDocument()
  })

  it('hides record button without the capability', () => {
    vi.mocked(useFinancialChargeDetail).mockReturnValue({ isPending: false, isError: false, data: { ...charge, payments: [] } } as never)
    renderModal('Gestor de Inventario')
    expect(screen.queryByRole('button', { name: 'Registrar pago completo' })).not.toBeInTheDocument()
  })

  it('invokes onRecord with the charge', () => {
    const onRecord = vi.fn()
    render(<FinancialDetailModal id={4} role="Administrador" onClose={vi.fn()} onRecord={onRecord} />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago completo' }))
    expect(onRecord).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }))
  })
})
