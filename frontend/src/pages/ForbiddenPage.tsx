import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'

export function ForbiddenPage() {
  const { user } = useAuth()
  const permissionCodes = user?.permissionCodes ?? []
  const hasErpAccess = permissionCodes.length > 0
  return (
    <main className="auth-page card">
      <h1>Acceso no autorizado</h1>
      <p>No tienes permisos para ver esta página.</p>
      {hasErpAccess ? (
        <>
          <p>Tienes acceso al ERP SGI-Curime, pero no a este recurso específico.</p>
          <Link to="/app" className="primary">
            Ir al ERP
          </Link>
        </>
      ) : (
        <p>Inicia sesión para acceder al sistema.</p>
      )}
    </main>
  )
}