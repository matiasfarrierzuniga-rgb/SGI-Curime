import type { PaginatedResponse } from './api'
export type AssemblyStatus = 'SCHEDULED'|'COMPLETED'|'CANCELLED'
export type AttendanceStatus = 'PRESENT'|'ABSENT'|'JUSTIFIED'
export interface Assembly { id:number; title:string; type:string|null; date:string; place:string; description:string|null; status:AssemblyStatus; createdAt:string; updatedAt:string }
export interface AssemblyPayload { title:string; type?:string; date:string; place:string; description?:string; status?:AssemblyStatus }
export interface AssemblyQuery { search?:string; status?:AssemblyStatus; dateFrom?:string; dateTo?:string; page:number; limit:number }
export interface AttendanceRecord { id:number; status:AttendanceStatus; registeredAt:string; observations:string|null; assemblyId:number; affiliateId:number; affiliate:{id:number;fullName:string;identification:string;status:'ACTIVE'|'INACTIVE'}; createdAt:string; updatedAt:string }
export interface AttendanceSummary { assemblyId:number; totalActive:number; present:number; absent:number; justified:number; unrecorded:number; attendancePercentage:number; data:AttendanceRecord[] }
export interface AttendanceEntry { affiliateId:number; status:AttendanceStatus; observations?:string }
export type AssemblyList = PaginatedResponse<Assembly>
