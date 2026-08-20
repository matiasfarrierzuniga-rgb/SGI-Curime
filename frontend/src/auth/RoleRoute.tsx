import { Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ForbiddenPage } from '../pages/ForbiddenPage'
export function RoleRoute({ role }: { role: string | string[] }) { const { user } = useAuth(); const allowed = Array.isArray(role) ? role.includes(user?.role ?? '') : user?.role === role; return allowed ? <Outlet /> : <ForbiddenPage /> }
