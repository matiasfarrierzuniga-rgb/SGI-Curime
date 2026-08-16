import type { PaginatedResponse } from './api'; import type { Reviewer } from './affiliateRequests'
export type JustificationStatus='PENDING'|'APPROVED'|'REJECTED'
export interface Justification { id:number; reason:string; status:JustificationStatus; rejectionReason:string|null; reviewedAt:string|null; reviewedById:number|null; assemblyId:number; affiliateId:number; assembly:{id:number;title:string;date:string}; affiliate:{id:number;fullName:string;identification:string}; reviewedBy:Reviewer|null; createdAt:string; updatedAt:string }
export interface JustificationQuery { status?:JustificationStatus; assemblyId?:number; affiliateId?:number; page:number; limit:number }
export type JustificationList=PaginatedResponse<Justification>
