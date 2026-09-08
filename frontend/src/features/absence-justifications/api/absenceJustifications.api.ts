import { httpClient } from '@/shared/api/httpClient'
import type {
  AbsenceJustification,
  AbsenceJustificationListFilters,
  AbsenceJustificationListResponse,
  RejectAbsenceJustificationPayload,
  ReviewAbsenceJustificationPayload,
} from '../model/absenceJustifications.types'

type AssemblyOption = {
  id: number
  title: string
  date: string
  place?: string | null
  type?: string | null
}

type AffiliateAbsenceJustificationPayload = {
  assemblyId: number
  reason: string
  attachment?: File
}

export const absenceJustificationsService = {
  async list(filters: AbsenceJustificationListFilters) {
    return (await httpClient.get<AbsenceJustificationListResponse>('/absence-justifications', { params: filters })).data
  },
  async listForAffiliate(affiliateId: number, filters: AbsenceJustificationListFilters) {
    return (await httpClient.get<AbsenceJustificationListResponse>(`/affiliates/${affiliateId}/absence-justifications`, { params: filters })).data
  },
  async getEvidence(id: number) {
    return (await httpClient.get<Pick<AbsenceJustification, 'attachmentUrl'>>(`/absence-justifications/${id}/evidence`)).data
  },
  async getEvidenceFile(id: number) {
    return (await httpClient.get<Blob>(`/absence-justifications/${id}/evidence/file`, { responseType: 'blob' })).data
  },
  async listAssemblies() {
    return (await httpClient.get<{ data: AssemblyOption[] }>('/assemblies', { params: { page: 1, limit: 100 } })).data
  },
  async createForAffiliate(affiliateId: number, payload: AffiliateAbsenceJustificationPayload) {
    const formData = new FormData()
    formData.append('assemblyId', String(payload.assemblyId))
    formData.append('reason', payload.reason)
    if (payload.attachment) formData.append('attachment', payload.attachment)
    return (await httpClient.post<AbsenceJustification>(`/affiliates/${affiliateId}/absence-justifications`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  },
  async approve(id: number, payload?: ReviewAbsenceJustificationPayload) {
    return (await httpClient.patch<AbsenceJustification>(`/absence-justifications/${id}/approve`, payload)).data
  },
  async reject(id: number, payload: RejectAbsenceJustificationPayload) {
    return (await httpClient.patch<AbsenceJustification>(`/absence-justifications/${id}/reject`, payload)).data
  },
}
