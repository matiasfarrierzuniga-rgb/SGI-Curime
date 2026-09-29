import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../model/AuthContext'
import { hasCapability } from '../../../shared/security/access'

type RoleRouteProps = {
  capability?: string
}

export function RoleRoute({ capability }: RoleRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const allowed = capability === undefined || (
    isAuthenticated && user?.canAccessErp === true && hasCapability(user.permissionCodes, capability)
  )

  return allowed ? <Outlet /> : <Navigate to="/403" replace />
}
