export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export interface CreateUserRequest { fullName: string; identificationType: 'NATIONAL' | 'DIMEX'; identification: string; email: string; phoneCountryCode?: string; phoneNationalNumber?: string; address?: string; reason: string }
export interface UserRequest extends CreateUserRequest { id: number; phone?: string | null; status: RequestStatus; rejectionReason: string | null; reviewedAt: string | null; reviewedById: number | null; createdAt: string; updatedAt: string }
export interface UserRequestQuery { page?: number; limit?: number; status?: RequestStatus; email?: string; identification?: string }
