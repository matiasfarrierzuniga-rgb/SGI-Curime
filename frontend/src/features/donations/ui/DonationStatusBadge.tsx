import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { DonationStatus } from '../model/donations.types'
import { donationStatusLabel } from './donationPresentation'

export function DonationStatusBadge({ status }: { status: DonationStatus }) {
  return <StatusBadge variant={status === 'CONFIRMED' ? 'success' : 'warning'}>{donationStatusLabel(status)}</StatusBadge>
}
