import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../model/AuthContext'
import { hasCapability } from '../../../shared/security/access'
import type { AccessCapability } from '../../../shared/security/access'

type RoleRouteProps = {
  capability?: AccessCapability | string
  anyOfCapabilities?: readonly AccessCapability[]
}

export function RoleRoute({ capability, anyOfCapabilities }: RoleRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const requiresCapability = capability !== undefined || anyOfCapabilities !== undefined
  const hasRequiredCapability = capability !== undefined
    ? hasCapability(user?.permissionCodes, capability)
    : Boolean(anyOfCapabilities?.length && anyOfCapabilities.some(item => hasCapability(user?.permissionCodes, item)))
  const allowed = !requiresCapability || (isAuthenticated && user?.canAccessErp === true && hasRequiredCapability)

  return allowed ? <Outlet /> : <Navigate to="/403" replace />
}
