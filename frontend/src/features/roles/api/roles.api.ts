import { httpClient } from '@/shared/api/httpClient'
import type { RoleOption } from '../model/roles.types'

export const rolesService = {
  async listActive() {
    return (await httpClient.get<RoleOption[]>('/roles')).data
  },
}
