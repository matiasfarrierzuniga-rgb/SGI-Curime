import { httpClient } from '@/shared/api/httpClient'
import type { PaginatedResponse } from '../types/api'
import type { CreateUserRequest, UserRequest, UserRequestQuery } from '../types/userRequests'
export const userRequestsService = {
  async create(payload: CreateUserRequest) { return (await httpClient.post<UserRequest>('/user-requests', payload)).data },
  async list(params: UserRequestQuery) { return (await httpClient.get<PaginatedResponse<UserRequest>>('/user-requests', { params })).data },
  async get(id: number) { return (await httpClient.get<UserRequest>(`/user-requests/${id}`)).data },
  async approve(id: number, roleId: number) { return (await httpClient.patch(`/user-requests/${id}/approve`, { roleId })).data as unknown },
  async reject(id: number, rejectionReason: string) { return (await httpClient.patch<UserRequest>(`/user-requests/${id}/reject`, { rejectionReason })).data },
}
