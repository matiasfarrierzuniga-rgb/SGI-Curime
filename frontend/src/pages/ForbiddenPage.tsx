import { Link } from 'react-router-dom'
export function ForbiddenPage() { return <main className="auth-page card"><h1>Acceso no autorizado</h1><p>No tienes permisos para ver esta página.</p><Link to="/profile">Volver a mi perfil</Link></main> }
