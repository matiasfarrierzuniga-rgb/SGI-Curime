import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../model/AuthContext'
import {
  hasAuthenticatedSessionCapability,
  hasCapability,
} from '../../../shared/security/access'

type RoleRouteProps = {
  role?: string | string[]
  capability?: string
}

export function RoleRoute({ role, capability }: RoleRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const allowed = capability !== undefined
    ? isAuthenticated && (
      hasCapability(user?.role, capability) ||
      hasAuthenticatedSessionCapability(capability)
    )
    : role !== undefined && (
      Array.isArray(role)
        ? role.includes(user?.role ?? '')
        : user?.role === role
    )

  return allowed ? <Outlet /> : <Navigate to="/403" replace />
}
