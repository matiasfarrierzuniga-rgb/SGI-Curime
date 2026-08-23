import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../model/AuthContext'
export function RoleRoute({ role }: { role: string | string[] }) { const { user } = useAuth(); const allowed = Array.isArray(role) ? role.includes(user?.role ?? '') : user?.role === role; return allowed ? <Outlet /> : <Navigate to="/403" replace /> }
