import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../model/AuthContext'
import { ROLE_COMMUNITY_ACCOUNT } from '@/shared/security/roles'

export function InternalErpRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <p className="container">Restaurando sesión…</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.canAccessErp === true) return <Outlet />
  return <Navigate to={user?.role === ROLE_COMMUNITY_ACCOUNT ? '/mi-comunidad' : '/servicios'} replace />
}
