import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ReservationActions } from './ReservationActions'

vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { permissionCodes: ['res.reservations.approve', 'res.reservations.reject', 'res.reservations.cancel'] } }) }))

type Status = ComponentProps<typeof ReservationActions>['status']
type Capability = 'res.reservations.approve' | 'res.reservations.reject' | 'res.reservations.cancel'
const statuses: Status[] = ['PENDING', 'APPROVED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED']
const capabilities: Capability[] = ['res.reservations.approve', 'res.reservations.reject', 'res.reservations.cancel']
const actionFor = (status: Status, capability: Capability) => status === 'PENDING' && capability === 'res.reservations.approve' ? 'Aprobar' : status === 'PENDING' && capability === 'res.reservations.reject' ? 'Rechazar' : (status === 'PENDING' || status === 'APPROVED' || status === 'CONFIRMED') && capability === 'res.reservations.cancel' ? 'Cancelar reserva' : null

function renderActions(status: Status, permissionCodes?: readonly string[]) {
  render(<ReservationActions status={status} permissionCodes={permissionCodes} onApprove={vi.fn()} onReject={vi.fn()} onCancel={vi.fn()} />)
}

describe('ReservationActions', () => {
  it.each(statuses.flatMap(status => capabilities.map(capability => [status, capability, actionFor(status, capability)] as const)))('shows only %s action for isolated %s capability', (status, capability, expectedAction) => {
    renderActions(status, [capability])
    if (expectedAction) expect(screen.getByRole('button', { name: expectedAction })).toBeInTheDocument()
    else expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(expectedAction ? 1 : 0)
  })

  it('uses explicit permissionCodes instead of authenticated permissions', () => {
    renderActions('PENDING', [])
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
