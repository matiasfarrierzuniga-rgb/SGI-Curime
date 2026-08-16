import type { PaginatedResponse } from './api'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export interface Reviewer { id: number; fullName: string; email: string }
export interface AffiliateRequest { id:number; fullName:string; identification:string; birthDate:string; gender:string|null; phone:string|null; email:string|null; address:string; occupation:string|null; workplace:string|null; affiliationReason:string; status:RequestStatus; rejectionReason:string|null; reviewedAt:string|null; reviewedById:number|null; reviewedBy:Reviewer|null; createdAt:string; updatedAt:string }
export interface CreateAffiliateRequest { fullName:string; identification:string; birthDate:string; gender?:string; phone?:string; email?:string; address:string; occupation?:string; workplace?:string; affiliationReason:string }
export interface AffiliateRequestQuery { status?:RequestStatus; search?:string; page:number; limit:number }
export type AffiliateRequestList = PaginatedResponse<AffiliateRequest>
