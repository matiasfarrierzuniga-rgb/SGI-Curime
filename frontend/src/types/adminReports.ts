import type { AssemblyStatus } from './assemblies'
export interface AffiliatesSummary { total:number;active:number;inactive:number;pendingRequests:number }
export interface AttendanceReportRow { id:number;title:string;date:string;status:AssemblyStatus;totalActive:number;present:number;absent:number;justified:number;unrecorded:number;attendancePercentage:number }
export interface AttendanceReport { assemblies:number;totals:{present:number;absent:number;justified:number};data:AttendanceReportRow[] }
export interface JustificationsSummary { total:number;PENDING:number;APPROVED:number;REJECTED:number }
export interface SanctionsSummary { total:number;ACTIVE:number;RESOLVED:number;REVOKED:number }
export interface ReportQuery { dateFrom?:string;dateTo?:string;assemblyId?:number }
