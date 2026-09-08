import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { financialApi } from '../api/financial.api'
import { useCreateFinancialMovement, useFinancialChargeDetail, useFinancialChargesList, useFinancialMovementsList, useFinancialMovementSummary, useRecordPayment } from './useFinancial'

vi.mock('../api/financial.api', () => ({ financialApi: { listCharges: vi.fn(), getCharge: vi.fn(), recordPayment: vi.fn(), listMovements: vi.fn(), getMovement: vi.fn(), getMovementSummary: vi.fn(), createMovement: vi.fn() } }))

const charge = { id: 4, reservationId: 9, amount: '15000.00', currency: 'CRC', status: 'PENDING', createdAt: '2030-01-01T10:00:00.000Z', updatedAt: '2030-01-01T10:00:00.000Z' } as const

function renderHarness() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Harness() {
    const list = useFinancialChargesList({ page: 1, limit: 20 })
    const detail = useFinancialChargeDetail(4)
    const record = useRecordPayment()
    return <>
      <span data-testid="list-count">{list.data?.data.length ?? 'none'}</span>
      <span data-testid="detail-status">{detail.data?.status ?? 'none'}</span>
      <button type="button" onClick={() => record.mutate({ id: 4, payload: { amount: '15000.00', method: 'CASH' } }, { onError: () => undefined })}>pay</button>
    </>
  }
  render(<QueryClientProvider client={queryClient}><Harness /></QueryClientProvider>)
  return queryClient
}

describe('useRecordPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(financialApi.listCharges).mockResolvedValue({ data: [charge], total: 1, page: 1, limit: 20 } as never)
  })

  it('invalidates list and detail so the refreshed UI reflects PAID after success', async () => {
    vi.mocked(financialApi.getCharge).mockResolvedValue({ ...charge, payments: [] } as never)
    vi.mocked(financialApi.recordPayment).mockResolvedValue({ payment: {}, charge: { ...charge, status: 'PAID' } } as never)
    renderHarness()
    await waitFor(() => expect(screen.getByTestId('list-count')).toHaveTextContent('1'))
    expect(screen.getByTestId('detail-status')).toHaveTextContent('PENDING')
    expect(financialApi.listCharges).toHaveBeenCalledTimes(1)
    expect(financialApi.getCharge).toHaveBeenCalledTimes(1)
    vi.mocked(financialApi.getCharge).mockResolvedValue({ ...charge, status: 'PAID', payments: [] } as never)
    fireEvent.click(screen.getByRole('button', { name: 'pay' }))
    await waitFor(() => expect(financialApi.listCharges).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(financialApi.getCharge).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByTestId('detail-status')).toHaveTextContent('PAID'))
  })

  it('refreshes charges after a 409 conflict without showing stale data', async () => {
    vi.mocked(financialApi.getCharge).mockResolvedValue({ ...charge, payments: [] } as never)
    vi.mocked(financialApi.recordPayment).mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'Financial charge is not pending' } } } as never)
    renderHarness()
    await waitFor(() => expect(screen.getByTestId('list-count')).toHaveTextContent('1'))
    fireEvent.click(screen.getByRole('button', { name: 'pay' }))
    await waitFor(() => expect(financialApi.listCharges).toHaveBeenCalledTimes(2))
    expect(financialApi.getCharge).toHaveBeenCalledTimes(2)
  })

  it('does not refresh on unrelated errors', async () => {
    vi.mocked(financialApi.getCharge).mockResolvedValue({ ...charge, payments: [] } as never)
    vi.mocked(financialApi.recordPayment).mockRejectedValue(new Error('network down')) as never
    renderHarness()
    await waitFor(() => expect(screen.getByTestId('list-count')).toHaveTextContent('1'))
    fireEvent.click(screen.getByRole('button', { name: 'pay' }))
    await waitFor(() => expect(financialApi.getCharge).toHaveBeenCalledTimes(1))
  })

  it('does not mutate reservations when recording a payment', async () => {
    const payment = { id: 1, chargeId: 4, amount: '15000.00', status: 'CONFIRMED', method: 'CASH', reference: null, paidAt: '2030-01-02T09:00:00.000Z', recordedById: 2, createdAt: '2030-01-02T09:00:00.000Z' } as const
    vi.mocked(financialApi.getCharge).mockResolvedValue({ ...charge, payments: [] } as never)
    vi.mocked(financialApi.recordPayment).mockResolvedValue({ payment, charge: { ...charge, status: 'PAID' } } as never)
    renderHarness()
    fireEvent.click(screen.getByRole('button', { name: 'pay' }))
    await waitFor(() => expect(financialApi.recordPayment).toHaveBeenCalledTimes(1))
    expect(financialApi.recordPayment).toHaveBeenCalledWith(4, { amount: '15000.00', method: 'CASH' })
  })
})

describe('Financial Movement hooks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists movements, fetches date-filtered summary, and refreshes both after creation', async () => {
    const movement = { id: 8, type: 'INCOME', source: 'MANUAL', amount: '5000.00', currency: 'CRC', description: 'Actividad comunal', reference: null, occurredAt: '2030-01-01T12:00:00.000Z', sourceId: null, recordedById: 2, createdAt: '2030-01-01T12:00:00.000Z', updatedAt: '2030-01-01T12:00:00.000Z' } as const
    vi.mocked(financialApi.listMovements).mockResolvedValue({ data: [movement], total: 1, page: 1, limit: 20 } as never)
    vi.mocked(financialApi.getMovementSummary).mockResolvedValue({ currency: 'CRC', totalIncome: '5000.00', totalExpenses: '0.00', balance: '5000.00' } as never)
    vi.mocked(financialApi.createMovement).mockResolvedValue(movement as never)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    function Harness() {
      const list = useFinancialMovementsList({ dateFrom: '2030-01-01', page: 1, limit: 20 })
      const summary = useFinancialMovementSummary({ dateFrom: '2030-01-01' })
      const create = useCreateFinancialMovement()
      return <><span data-testid="movement-count">{list.data?.data.length ?? 'none'}</span><span data-testid="movement-balance">{summary.data?.balance ?? 'none'}</span><button type="button" onClick={() => create.mutate({ type: 'INCOME', amount: '5000.00', description: 'Actividad comunal', occurredAt: '2030-01-01T12:00:00.000Z' })}>create movement</button></>
    }
    render(<QueryClientProvider client={queryClient}><Harness /></QueryClientProvider>)
    await waitFor(() => expect(screen.getByTestId('movement-count')).toHaveTextContent('1'))
    expect(financialApi.getMovementSummary).toHaveBeenCalledWith({ dateFrom: '2030-01-01' })
    fireEvent.click(screen.getByRole('button', { name: 'create movement' }))
    await waitFor(() => expect(financialApi.listMovements).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(financialApi.getMovementSummary).toHaveBeenCalledTimes(2))
  })
})
