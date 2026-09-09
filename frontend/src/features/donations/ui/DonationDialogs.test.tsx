import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CancelDonationDialog } from './CancelDonationDialog'
import { DeleteDonationDialog } from './DeleteDonationDialog'

const mocks = vi.hoisted(() => ({
  useCancelDonation: vi.fn(),
  useDeleteDonation: vi.fn(),
}))

vi.mock('../hooks/donations.queries', () => ({
  useCancelDonation: mocks.useCancelDonation,
  useDeleteDonation: mocks.useDeleteDonation,
}))

describe('Donation dialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useCancelDonation.mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) })
    mocks.useDeleteDonation.mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockResolvedValue({ deleted: true, id: 8 }) })
  })

  it('requires cancellation reason and explains financial reversal', () => {
    render(<CancelDonationDialog id={8} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: 'Cancelar donación' })).toBeInTheDocument()
    expect(screen.getByText(/movimiento financiero de reversión/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar donación' }))
    expect(screen.getByRole('alert')).toHaveTextContent('motivo de cancelación es requerido')
  })

  it('submits a normalized cancellation reason', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    const onClose = vi.fn()
    mocks.useCancelDonation.mockReturnValue({ isPending: false, mutateAsync })
    render(<CancelDonationDialog id={8} onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('Motivo de cancelación'), { target: { value: '  Duplicado  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar donación' }))
    await Promise.resolve()
    expect(mutateAsync).toHaveBeenCalledWith({ id: 8, input: { cancellationReason: 'Duplicado' } })
  })

  it('explains restricted deletion and invokes delete mutation', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ deleted: true, id: 8 })
    mocks.useDeleteDonation.mockReturnValue({ isPending: false, mutateAsync })
    render(<DeleteDonationDialog id={8} onClose={vi.fn()} />)
    expect(screen.getByText(/registro fue ingresado por error/i)).toBeInTheDocument()
    expect(screen.getByText(/utilice Cancelar/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar donación' }))
    await Promise.resolve()
    expect(mutateAsync).toHaveBeenCalledWith(8)
  })
})
