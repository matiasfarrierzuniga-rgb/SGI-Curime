import { hasCapability } from '@/shared/security/access'
import { useAuth } from '@/features/auth'
import { Button } from '@/shared/ui/button'
import type { ReservationStatus } from '../model/reservations.types'

type ReservationActionsProps = {
  status: ReservationStatus
  permissionCodes?: readonly string[] | null
  disabled?: boolean
  onApprove: () => void
  onReject: () => void
  onCancel: () => void
}

export function ReservationActions({ status, permissionCodes, disabled, onApprove, onReject, onCancel }: ReservationActionsProps) {
  const { user } = useAuth()
  const codes = permissionCodes ?? user?.permissionCodes
  const pending = status === 'PENDING'
  const mayCancel = status === 'PENDING' || status === 'APPROVED' || status === 'CONFIRMED'
  return <div className="flex flex-wrap gap-2">
    {pending && hasCapability(codes, 'res.reservations.approve') ? <Button size="sm" type="button" disabled={disabled} onClick={onApprove}>Aprobar</Button> : null}
    {pending && hasCapability(codes, 'res.reservations.reject') ? <Button size="sm" variant="outline" type="button" disabled={disabled} onClick={onReject}>Rechazar</Button> : null}
    {mayCancel && hasCapability(codes, 'res.reservations.cancel') ? <Button size="sm" variant="destructive" type="button" disabled={disabled} onClick={onCancel}>Cancelar reserva</Button> : null}
  </div>
}
