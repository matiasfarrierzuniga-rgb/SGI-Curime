import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../model/AuthContext'

export function InternalErpRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <p className="container">Restaurando sesión…</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return user?.canAccessErp ? <Outlet /> : <Navigate to="/servicios" replace />
}
