export interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number }
export interface ApiMessage { message: string }
