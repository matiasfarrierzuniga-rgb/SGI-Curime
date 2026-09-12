export type AssemblyQuorumType = 'FIXED' | 'PERCENTAGE'
export type AssemblyStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'JUSTIFIED'

export interface QuorumResult {
  available: boolean
  convokedCount: number
  presentCount: number
  quorumType: AssemblyQuorumType | null
  quorumValue: number | null
  requiredCount: number | null
  quorumReached: boolean | null
  reason?: string
}

export interface Convocation {
  id: number
  affiliateId: number
  roleNameSnapshot: string
  affiliate: { id: number; fullName: string; status: string }
}

export interface Assembly {
  id: number
  title: string
  type: string | null
  date: string
  place: string
  description: string | null
  status: AssemblyStatus
  quorumType: AssemblyQuorumType | null
  quorumValue: number | null
  convocationsLockedAt: string | null
  _count?: { convocations: number }
}

export interface AttendanceItem extends Convocation { attendance: { id: number; status: AttendanceStatus } | null }
export interface AttendanceSummary { present: number; absent: number; justified: number; unrecorded: number; data: AttendanceItem[]; quorum: QuorumResult }
export interface AssemblyDetail extends Assembly { convocations: Convocation[]; quorum: QuorumResult; attendance: AttendanceSummary }
export interface EligibleAffiliate { id: number; fullName: string; role: { id: number; name: string } }
export interface AssemblyPayload { title: string; type?: string; date: string; place: string; description?: string; quorumType: AssemblyQuorumType; quorumValue: number }
export interface MineAssembly extends Convocation { assembly: Assembly & { attendanceStatus: AttendanceStatus | null; justification: { id: number; status: 'PENDING' | 'APPROVED' | 'REJECTED' } | null } }
