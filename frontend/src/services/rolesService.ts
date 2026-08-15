import { httpClient } from '../api/httpClient'
import type { RoleOption } from '../types/users'

export const rolesService = {
  async listActive() {
    return (await httpClient.get<RoleOption[]>('/roles')).data
  },
}
