import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../model/AuthContext'

export function InternalErpRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const path = location.pathname

  if (isLoading) return <p className="container">Restaurando sesión…</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Routes that should be accessible to any authenticated user
  // (community routes that match navigation items without capability guards)
  const communityRoutes = [
    '/app/assemblies/mine',
    '/app/affiliate/absence-justifications/new',
    '/app/affiliate/justifications',
  ]
  const isCommunityRoute = communityRoutes.some((p) => path.startsWith(p))

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isCommunityRoute) return <Outlet />
  return user?.permissionCodes?.length ? <Outlet /> : <Navigate to="/servicios" replace />
}
