import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { useRecordPayment } from '../hooks/useFinancial'
import { FinancialPaymentModal } from './FinancialPaymentModal'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../hooks/useFinancial', () => ({ useRecordPayment: vi.fn() }))

const charge = { id: 4, reservationId: 9, amount: '15000.00', balance: '15000.00', currency: 'CRC', status: 'PENDING', dueAt: null, createdAt: '2030-01-01T10:00:00.000Z', updatedAt: '2030-01-01T10:00:00.000Z' } as const

describe('FinancialPaymentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(useRecordPayment).mockReturnValue({ isPending: false, mutateAsync: vi.fn() } as never)
  })

  const renderModal = (onClose: () => void) => render(<FinancialPaymentModal charge={charge} onClose={onClose} />)

  it('prefills the exact amount from the charge', () => {
    renderModal(vi.fn())
    expect(screen.getByLabelText('Monto a liquidar')).toHaveValue('15000.00')
    expect(screen.getByText(/Monto del cargo:/)).toBeInTheDocument()
  })

  it('submits only amount, method, and reference without status or recordedById', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useRecordPayment).mockReturnValue({ isPending: false, mutateAsync: mutateAsync as never } as never)
    renderModal(vi.fn())
    fireEvent.change(screen.getByLabelText('Método de pago'), { target: { value: 'BANK_TRANSFER' } })
    fireEvent.change(screen.getByLabelText('Referencia (opcional)'), { target: { value: 'TRX-9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Liquidar cargo' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: 4, payload: { amount: '15000.00', method: 'BANK_TRANSFER', reference: 'TRX-9' } }))
    expect(mutateAsync.mock.calls[0][0].payload).not.toHaveProperty('status')
    expect(mutateAsync.mock.calls[0][0].payload).not.toHaveProperty('paidAt')
    expect(mutateAsync.mock.calls[0][0].payload).not.toHaveProperty('recordedById')
  })

  it('omits the reference when empty', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useRecordPayment).mockReturnValue({ isPending: false, mutateAsync: mutateAsync as never } as never)
    renderModal(vi.fn())
    fireEvent.change(screen.getByLabelText('Método de pago'), { target: { value: 'CASH' } })
    fireEvent.click(screen.getByRole('button', { name: 'Liquidar cargo' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: 4, payload: { amount: '15000.00', method: 'CASH' } }))
  })

  it('requires a valid amount and method on submit', async () => {
    renderModal(vi.fn())
    fireEvent.change(screen.getByLabelText('Monto a liquidar'), { target: { value: '0.001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Liquidar cargo' }))
    expect(await screen.findByText('Ingrese un monto válido con hasta dos decimales.')).toBeInTheDocument()
    expect(screen.getByText('Seleccione un método de pago.')).toBeInTheDocument()
  })

  it('closes and toasts on success', async () => {
    const onClose = vi.fn()
    vi.mocked(useRecordPayment).mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockResolvedValue({ payment: {}, charge: { ...charge, status: 'PAID' } }) } as never)
    renderModal(onClose)
    fireEvent.change(screen.getByLabelText('Método de pago'), { target: { value: 'CASH' } })
    fireEvent.click(screen.getByRole('button', { name: 'Liquidar cargo' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('closes and refreshes through the parent after a 409 conflict', async () => {
    const onClose = vi.fn()
    vi.mocked(useRecordPayment).mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'El cargo financiero ya fue pagado' } } }) } as never)
    renderModal(onClose)
    fireEvent.change(screen.getByLabelText('Método de pago'), { target: { value: 'CASH' } })
    fireEvent.click(screen.getByRole('button', { name: 'Liquidar cargo' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('El cargo financiero ya fue pagado'))
    expect(onClose).toHaveBeenCalled()
  })

  it.each(['0', '0.00', '5000.00', '15000.01'])('rejects non-exact payment amount %s before submit', async amount => {
    const mutateAsync = vi.fn()
    vi.mocked(useRecordPayment).mockReturnValue({ isPending: false, mutateAsync: mutateAsync as never } as never)
    renderModal(vi.fn())
    fireEvent.change(screen.getByLabelText('Monto a liquidar'), { target: { value: amount } })
    fireEvent.change(screen.getByLabelText('Método de pago'), { target: { value: 'CASH' } })
    fireEvent.click(screen.getByRole('button', { name: 'Liquidar cargo' }))
    await waitFor(() => expect(mutateAsync).not.toHaveBeenCalled())
  })

  it('guards against double submission while pending', async () => {
    const onClose = vi.fn()
    let resolve: (value: unknown) => void = () => undefined
    const pending = new Promise(r => { resolve = r })
    const mutateAsync = vi.fn().mockReturnValue(pending)
    const { rerender } = render(<FinancialPaymentModal charge={charge} onClose={onClose} />)
    vi.mocked(useRecordPayment).mockReturnValue({ isPending: true, mutateAsync: mutateAsync as never } as never)
    rerender(<FinancialPaymentModal charge={charge} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrando pago...' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(mutateAsync).not.toHaveBeenCalled()
    resolve({ payment: {}, charge })
    await waitFor(() => undefined)
  })
})
