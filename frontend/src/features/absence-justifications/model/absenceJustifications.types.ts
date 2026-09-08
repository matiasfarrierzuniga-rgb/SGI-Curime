import type { PaginatedResponse } from '@/shared/api/api.types'

export type JustificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AbsenceJustificationAssembly {
  id: number
  title: string
  date: string
}

export interface AbsenceJustificationAffiliate {
  id: number
  fullName: string
  identification: string
}

export interface AbsenceJustificationReviewer {
  id: number
  fullName: string
  email: string
}

export interface AbsenceJustificationAttachment {
  originalName: string
  mimeType: string
  size: number
  url?: string | null
}

export interface AbsenceJustification {
  id: number
  reason: string
  status: JustificationStatus
  decisionNote: string | null
  attachment?: AbsenceJustificationAttachment | null
  attachmentOriginalName?: string | null
  attachmentMimeType?: string | null
  attachmentSize?: number | null
  attachmentUrl?: string | null
  rejectionReason: string | null
  reviewedAt: string | null
  reviewedById: number | null
  assemblyId: number
  affiliateId: number
  assembly: AbsenceJustificationAssembly
  affiliate: AbsenceJustificationAffiliate
  reviewedBy: AbsenceJustificationReviewer | null
  createdAt: string
  updatedAt: string
}

export interface ReviewAbsenceJustificationPayload {
  observation?: string
}

export interface AbsenceJustificationListFilters {
  status?: JustificationStatus
  assemblyId?: number
  affiliateId?: number
  page?: number
  limit?: number
}

export type AbsenceJustificationListResponse = PaginatedResponse<AbsenceJustification>

export interface RejectAbsenceJustificationPayload {
  rejectionReason: string
}
