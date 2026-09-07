import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ReservationActions } from './ReservationActions'

function renderActions(status: ComponentProps<typeof ReservationActions>['status'], role = 'Administrador') {
  render(<ReservationActions status={status} role={role} onApprove={vi.fn()} onReject={vi.fn()} onCancel={vi.fn()} />)
}

describe('ReservationActions', () => {
  it('shows all pending transitions only for matching capabilities', () => {
    renderActions('PENDING')
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar reserva' })).toBeInTheDocument()
  })

  it.each(['APPROVED', 'CONFIRMED'] as const)('shows cancellation for %s', (status) => {
    renderActions(status)
    expect(screen.getByRole('button', { name: 'Cancelar reserva' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
  })

  it.each(['REJECTED', 'CANCELLED', 'COMPLETED'] as const)('hides transitions for terminal %s status', (status) => {
    renderActions(status)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
