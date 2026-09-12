import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DonationsPage } from './DonationsPage'
import { formatDonationAmount } from './donationPresentation'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useDonationsList: vi.fn(),
  useDonationDetail: vi.fn(),
  useCreateDonation: vi.fn(),
  useUpdateDonation: vi.fn(),
  useCancelDonation: vi.fn(),
  useDeleteDonation: vi.fn(),
}))

vi.mock('@/features/auth', () => ({ useAuth: mocks.useAuth }))
vi.mock('../hooks/donations.queries', () => ({
  useDonationsList: mocks.useDonationsList,
  useDonationDetail: mocks.useDonationDetail,
  useCreateDonation: mocks.useCreateDonation,
  useUpdateDonation: mocks.useUpdateDonation,
  useCancelDonation: mocks.useCancelDonation,
  useDeleteDonation: mocks.useDeleteDonation,
}))

const donation = {
  id: 8,
  donorName: null,
  donorIdentification: null,
  amount: '25000.00',
  currency: 'CRC',
  method: 'SINPE_MOVIL' as const,
  reference: 'SINPE-8',
  description: null,
  receivedAt: '2026-09-09T16:00:00.000Z',
  status: 'CONFIRMED' as const,
  recordedById: 17,
  cancelledById: null,
  cancelledAt: null,
  cancellationReason: null,
  originalMovementId: 84,
  reversalMovementId: null,
  createdAt: '2026-09-09T16:00:00.000Z',
  updatedAt: '2026-09-09T16:00:00.000Z',
}

function listState(overrides = {}) {
  return { isPending: false, isError: false, data: { data: [donation], total: 21, page: 1, limit: 20 }, refetch: vi.fn(), ...overrides }
}

describe('DonationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useAuth.mockReturnValue({ user: { role: 'Administrador' } })
    mocks.useDonationsList.mockReturnValue(listState())
  })

  it('shows loading, empty, and error list states', () => {
    mocks.useDonationsList.mockReturnValueOnce(listState({ isPending: true, data: undefined }))
    const { rerender } = render(<DonationsPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando donaciones')
    mocks.useDonationsList.mockReturnValueOnce(listState({ data: { data: [], total: 0, page: 1, limit: 20 } }))
    rerender(<DonationsPage />)
    expect(screen.getByText('No existen donaciones registradas')).toBeInTheDocument()
    mocks.useDonationsList.mockReturnValueOnce(listState({ isError: true, data: undefined }))
    rerender(<DonationsPage />)
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar las donaciones')
  })

  it('renders translated record data, filters, and server pagination', () => {
    render(<DonationsPage />)
    expect(screen.getAllByText('Anónima').length).toBeGreaterThan(0)
    expect(screen.getAllByText('SINPE Móvil').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Confirmada').length).toBeGreaterThan(0)
    const formattedAmount = formatDonationAmount(donation.amount, donation.currency)
    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.replace(/\s/g, ' ') === formattedAmount.replace(/\s/g, ' '),
      ).length,
    ).toBeGreaterThan(0)
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'SINPE-8' } })
    expect(mocks.useDonationsList).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'SINPE-8', page: 1 }))
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }))
    expect(mocks.useDonationsList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
  })

  it('gates donation actions by capability and hides delete from Treasurer', () => {
    mocks.useAuth.mockReturnValue({ user: { role: 'Tesorero' } })
    render(<DonationsPage />)
    expect(screen.getByRole('button', { name: 'Registrar donación' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Editar' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Cancelar' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
  })

  it('shows delete to Administrator only for confirmed donations without reversal', () => {
    render(<DonationsPage />)
    expect(screen.getAllByRole('button', { name: 'Eliminar' }).length).toBeGreaterThan(0)
  })
})
