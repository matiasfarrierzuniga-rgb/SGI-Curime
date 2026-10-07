import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DonationForm } from './DonationForm'
import { toDateTimeLocal } from './donationDateTime'

const mocks = vi.hoisted(() => ({
  useCreateDonation: vi.fn(),
  useUpdateDonation: vi.fn(),
}))

vi.mock('../hooks/donations.queries', () => ({
  useCreateDonation: mocks.useCreateDonation,
  useUpdateDonation: mocks.useUpdateDonation,
}))

const donation = {
  id: 8,
  donorName: 'Ana Pérez',
  donorIdentification: '1-2345-6789',
  amount: '25000.00',
  currency: 'CRC',
  method: 'CASH' as const,
  reference: null,
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

describe('DonationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useCreateDonation.mockReturnValue({ isPending: false, mutateAsync: vi.fn() })
    mocks.useUpdateDonation.mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockResolvedValue(donation) })
  })

  it('renders stored UTC values as local datetime input values and round-trips selected local time', async () => {
    const update = vi.fn().mockResolvedValue(donation)
    mocks.useUpdateDonation.mockReturnValue({ isPending: false, mutateAsync: update })
    render(<DonationForm donation={donation} onClose={vi.fn()} />)

    const receivedAt = screen.getByLabelText('Fecha de recepción') as HTMLInputElement
    expect(receivedAt.value).toBe(toDateTimeLocal(donation.receivedAt))

    fireEvent.change(receivedAt, { target: { value: '2026-09-09T10:30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({
      id: donation.id,
      input: expect.objectContaining({ receivedAt: new Date('2026-09-09T10:30').toISOString() }),
    })))
  })

  it('clears donor PII in anonymous update payloads', async () => {
    const update = vi.fn().mockResolvedValue(donation)
    mocks.useUpdateDonation.mockReturnValue({ isPending: false, mutateAsync: update })
    render(<DonationForm donation={donation} onClose={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('Donación anónima'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({
      id: donation.id,
      input: expect.objectContaining({ donorName: '', donorIdentification: '' }),
    })))
  })

  it('shows validation feedback and disables controls while submitting', async () => {
    const { rerender } = render(<DonationForm onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrar donación' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ingrese un monto positivo')

    mocks.useCreateDonation.mockReturnValue({ isPending: true, mutateAsync: vi.fn() })
    rerender(<DonationForm onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Registrar donación/ })).toBeDisabled()
  })
})
