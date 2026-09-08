import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { financialApi } from '../api/financial.api'
import { FinancialMovementFormModal } from './FinancialMovementFormModal'

vi.mock('../api/financial.api', () => ({ financialApi: { createMovement: vi.fn() } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function renderModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onClose = vi.fn()
  render(<QueryClientProvider client={client}><FinancialMovementFormModal onClose={onClose} /></QueryClientProvider>)
  return onClose
}

describe('FinancialMovementFormModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows required validation errors without submitting', async () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar movimiento' }))
    expect(await screen.findByText('Seleccione el tipo de movimiento.')).toBeInTheDocument()
    expect(financialApi.createMovement).not.toHaveBeenCalled()
  })

  it('submits only backend create fields and closes after success', async () => {
    vi.mocked(financialApi.createMovement).mockResolvedValue({ id: 1 } as never)
    const onClose = renderModal()
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'INCOME' } })
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1250.50' } })
    fireEvent.change(screen.getByLabelText('Concepto o descripción'), { target: { value: 'Aporte comunal' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2030-01-01T09:30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar movimiento' }))
    await waitFor(() => expect(financialApi.createMovement).toHaveBeenCalledWith({ type: 'INCOME', amount: '1250.50', description: 'Aporte comunal', occurredAt: '2030-01-01T15:30:00.000Z' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps the form open when the backend rejects creation', async () => {
    vi.mocked(financialApi.createMovement).mockRejectedValue(new Error('network'))
    const onClose = renderModal()
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'EXPENSE' } })
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('Concepto o descripción'), { target: { value: 'Compra' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2030-01-01T09:30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar movimiento' }))
    await waitFor(() => expect(financialApi.createMovement).toHaveBeenCalledTimes(1))
    expect(onClose).not.toHaveBeenCalled()
  })
})
