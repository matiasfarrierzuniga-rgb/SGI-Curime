import { httpClient } from '@/shared/api/httpClient'
import type { PaginatedResponse } from '@/shared/api/api.types'
import type { AccountMutationResponse, User, UserQuery, UserUpdate } from '../model/users.types'
export const usersService = {
  async list(params: UserQuery) { return (await httpClient.get<PaginatedResponse<User>>('/users', { params })).data },
  async get(personId: string) { return (await httpClient.get<User>(`/users/${personId}`)).data },
  async update(accessId: number, payload: UserUpdate) { return (await httpClient.patch<AccountMutationResponse>(`/users/${accessId}`, payload)).data },
  async changeRole(accessId: number, roleId: number) { return (await httpClient.patch<AccountMutationResponse>(`/users/${accessId}/role`, { roleId })).data },
  async activate(accessId: number) { return (await httpClient.patch<AccountMutationResponse>(`/users/${accessId}/activate`)).data },
  async deactivate(accessId: number) { return (await httpClient.patch<AccountMutationResponse>(`/users/${accessId}/deactivate`)).data },
  async unlock(accessId: number) { return (await httpClient.patch<AccountMutationResponse>(`/users/${accessId}/unlock`)).data },
}
