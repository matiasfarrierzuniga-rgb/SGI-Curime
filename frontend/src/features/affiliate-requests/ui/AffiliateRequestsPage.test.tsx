import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AffiliateRequestDetail } from './AffiliateRequestDetail'
import { useAffiliateApprovalRoles, useAffiliateRequestDetail, useAffiliateRequestMutations } from '../hooks/useAffiliateRequestsQueries'

vi.mock('../hooks/useAffiliateRequestsQueries', () => ({ useAffiliateApprovalRoles: vi.fn(), useAffiliateRequestDetail: vi.fn(), useAffiliateRequestMutations: vi.fn(), useAffiliateRequestsList: vi.fn() }))

const request = { id: 7, fullName: 'Ana Pérez', identification: '123456789', identificationType: 'NATIONAL', birthDate: '1990-01-01T00:00:00.000Z', gender: null, phoneCountryCode: '+506', phoneNationalNumber: '88888888', phone: null, email: 'ana@example.com', address: 'Curime', occupation: null, workplace: null, affiliationReason: 'Participar', status: 'PENDING', rejectionReason: null, reviewedAt: null, reviewedById: null, reviewedBy: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' } as const
const roles = [{ id: 1, name: 'Administrador' }, { id: 4, name: 'Vecino/Afiliado' }, { id: 6, name: 'Miembro de Junta Directiva' }]

describe('AffiliateRequestDetail role approval', () => {
  const approve = { mutateAsync: vi.fn(), isPending: false }; const reject = { mutateAsync: vi.fn(), isPending: false }
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAffiliateRequestDetail).mockReturnValue({ data: request, isPending: false, isError: false, refetch: vi.fn() } as never)
    vi.mocked(useAffiliateApprovalRoles).mockReturnValue({ data: roles, isPending: false, isError: false, refetch: vi.fn() } as never)
    vi.mocked(useAffiliateRequestMutations).mockReturnValue({ approve, reject } as never)
  })

  it('requires a functional role and never shows Subscription_L1', () => {
    render(<AffiliateRequestDetail requestId={7} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Aprobar solicitud' })).toBeDisabled()
    expect(screen.queryByRole('option', { name: 'Subscription_L1' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Miembro de Junta Directiva' })).toBeInTheDocument()
  })

  it('approves once with the selected roleId', async () => {
    approve.mutateAsync.mockResolvedValue({})
    render(<AffiliateRequestDetail requestId={7} onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Rol funcional'), { target: { value: '6' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' }))
    const confirm = screen.getByRole('button', { name: 'Aprobar' }); fireEvent.click(confirm); fireEvent.click(confirm)
    await waitFor(() => expect(approve.mutateAsync).toHaveBeenCalledTimes(1))
    expect(approve.mutateAsync).toHaveBeenCalledWith({ id: 7, payload: { roleId: 6 } })
  })

  it('preserves the selected role after a recoverable approval error', async () => {
    approve.mutateAsync.mockRejectedValue(new Error('fallo'))
    render(<AffiliateRequestDetail requestId={7} onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Rol funcional'), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar solicitud' })); fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    expect(await screen.findByRole('alert')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByLabelText('Rol funcional')).toHaveValue('4')
  })
})
