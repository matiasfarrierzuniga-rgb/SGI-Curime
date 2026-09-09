import axios from 'axios'
import type { DonationMethod, DonationStatus } from '../model/donations.types'

export const donationMethods: DonationMethod[] = [
  'CASH',
  'BANK_TRANSFER',
  'SINPE_MOVIL',
  'OTHER',
]

export function donationMethodLabel(method: DonationMethod) {
  return {
    CASH: 'Efectivo',
    BANK_TRANSFER: 'Transferencia bancaria',
    SINPE_MOVIL: 'SINPE Móvil',
    OTHER: 'Otro',
  }[method]
}

export function donationStatusLabel(status: DonationStatus) {
  return status === 'CONFIRMED' ? 'Confirmada' : 'Cancelada'
}

export function formatDonationAmount(amount: string, currency: string) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

export function formatDonationDate(value: string | null) {
  if (!value) return 'Sin registro'
  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function getDonationErrorMessage(error: unknown, fallback: string) {
  const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined
  const code = Array.isArray(message) ? message[0] : message
  const messages: Record<string, string> = {
    DONATION_NOT_FOUND: 'La donación ya no existe.',
    DONATION_ALREADY_CANCELLED: 'Esta donación ya fue cancelada.',
    CANCELLED_DONATION_CANNOT_BE_EDITED: 'Una donación cancelada no puede editarse.',
    CANCELLED_DONATION_CANNOT_BE_DELETED: 'Una donación cancelada no puede eliminarse.',
    DONATION_HAS_FINANCIAL_EFFECTS: 'La donación tiene movimientos financieros relacionados y no puede eliminarse.',
    INVALID_DONATION_AMOUNT: 'Ingrese un monto positivo con máximo dos decimales.',
  }
  return typeof code === 'string' ? (messages[code] ?? code) : fallback
}
