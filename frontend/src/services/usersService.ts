import { httpClient } from '@/shared/api/httpClient'
import type { PaginatedResponse } from '../types/api'
import type { User, UserQuery, UserUpdate } from '../types/users'
export const usersService = {
  async list(params: UserQuery) { return (await httpClient.get<PaginatedResponse<User>>('/users', { params })).data },
  async get(id: number) { return (await httpClient.get<User>(`/users/${id}`)).data },
  async update(id: number, payload: UserUpdate) { return (await httpClient.patch<User>(`/users/${id}`, payload)).data },
  async changeRole(id: number, roleId: number) { return (await httpClient.patch<User>(`/users/${id}/role`, { roleId })).data },
  async activate(id: number) { return (await httpClient.patch<User>(`/users/${id}/activate`)).data },
  async deactivate(id: number) { return (await httpClient.patch<User>(`/users/${id}/deactivate`)).data },
  async unlock(id: number) { return (await httpClient.patch<User>(`/users/${id}/unlock`)).data },
}
