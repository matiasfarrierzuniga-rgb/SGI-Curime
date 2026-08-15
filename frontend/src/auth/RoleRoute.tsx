import { Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ForbiddenPage } from '../pages/ForbiddenPage'
export function RoleRoute({ role }: { role: string }) { const { user } = useAuth(); return user?.role === role ? <Outlet /> : <ForbiddenPage /> }
