import type { PaginatedResponse } from './api'
export type AffiliateStatus = 'ACTIVE' | 'INACTIVE'
export interface Affiliate { id:number; fullName:string; identification:string; birthDate:string; gender:string|null; phone:string|null; email:string|null; address:string; occupation:string|null; workplace:string|null; affiliateType:string|null; affiliationDate:string; status:AffiliateStatus; createdAt:string; updatedAt:string }
export interface AffiliateQuery { search?:string; status?:AffiliateStatus; page:number; limit:number }
export type AffiliateUpdate = Partial<Pick<Affiliate,'fullName'|'identification'|'birthDate'|'gender'|'phone'|'email'|'address'|'occupation'|'workplace'|'affiliateType'>>
export type AffiliateList = PaginatedResponse<Affiliate>
