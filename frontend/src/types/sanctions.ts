import type { PaginatedResponse } from './api'
export type SanctionStatus='ACTIVE'|'RESOLVED'|'REVOKED'
export interface Sanction { id:number; reason:string; description:string|null; date:string; status:SanctionStatus; affiliateId:number; affiliate:{id:number;fullName:string;identification:string;status:'ACTIVE'|'INACTIVE'}; createdById:number; createdBy:{id:number;fullName:string;email:string}; createdAt:string; updatedAt:string }
export interface SanctionPayload { reason:string; description?:string; date?:string; status?:SanctionStatus }
export interface SanctionQuery { affiliateId?:number; status?:SanctionStatus; dateFrom?:string; dateTo?:string; page:number; limit:number }
export type SanctionList=PaginatedResponse<Sanction>
