import { Navigate, Outlet } from 'react-router-dom'
import { hasManagementCapabilities } from '@/shared/security/access'
import { useAuth } from '../model/AuthContext'

/** UX boundary only; backend guards remain the security authority. */
export function ManagementRoute() {
  const { user } = useAuth()
  return hasManagementCapabilities(user?.role) ? <Outlet /> : <Navigate to="/mi-cuenta" replace />
}
