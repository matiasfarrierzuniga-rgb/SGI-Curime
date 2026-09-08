import axios from 'axios'
import { getErrorMessage } from '@/shared/lib/errors'
import type { FinancialChargeStatus, FinancialMovementSource, FinancialMovementType, PaymentMethod, PaymentStatus } from '../model/financial.types'

export function financialChargeStatusLabel(status: FinancialChargeStatus) {
  return { PENDING: 'Pendiente', PAID: 'Pagado', CANCELLED: 'Cancelado' }[status]
}

export function financialChargeStatusVariant(status: FinancialChargeStatus) {
  return { PENDING: 'warning', PAID: 'success', CANCELLED: 'neutral' }[status] as 'warning' | 'success' | 'neutral'
}

export function paymentStatusLabel(status: PaymentStatus) {
  return { PENDING: 'Pendiente', CONFIRMED: 'Confirmado', CANCELLED: 'Cancelado' }[status]
}

export function paymentMethodLabel(method: PaymentMethod) {
  return { CASH: 'Efectivo', BANK_TRANSFER: 'Transferencia bancaria', SINPE_MOVIL: 'SINPE Móvil', OTHER: 'Otro' }[method]
}

export function formatFinancialDate(value: string | null) {
  if (!value) return 'Sin registro'
  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Costa_Rica',
  }).format(new Date(value))
}

export function formatFinancialCurrency(amount: string, currency = 'CRC') {
  const value = Number(amount)
  if (!Number.isFinite(value)) return amount
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency }).format(value)
}

export function getFinancialErrorMessage(error: unknown, fallback = 'Ocurrió un error. Intenta nuevamente.') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined
    if (typeof data?.message === 'string') return data.message
    if (Array.isArray(data?.message)) return data.message.join('. ')
    const status = error.response?.status
    if (status === 400) return 'Los datos enviados no son válidos. Revise la información e intente nuevamente.'
    if (status === 404) return 'El cargo financiero no se encontró o ya no está disponible.'
    if (status === 409) return 'El cargo ya no está disponible para registrar el pago. Su estado fue actualizado.'
  }
  return getErrorMessage(error, fallback)
}

export function financialMovementTypeLabel(type: FinancialMovementType) {
  return { INCOME: 'Ingreso', EXPENSE: 'Egreso' }[type]
}

export function financialMovementSourceLabel(source: FinancialMovementSource) {
  return { MANUAL: 'Manual', RESERVATION_PAYMENT: 'Pago de reserva', DONATION: 'Donación' }[source]
}
