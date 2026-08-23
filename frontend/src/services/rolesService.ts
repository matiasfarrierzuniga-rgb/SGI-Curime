import { httpClient } from '@/shared/api/httpClient'
import type { RoleOption } from '@/features/users'

export const rolesService = {
  async listActive() {
    return (await httpClient.get<RoleOption[]>('/roles')).data
  },
}
