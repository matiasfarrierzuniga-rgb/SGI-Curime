import { ExternalLink, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { Badge } from '@/shared/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export function AccountHomePage() {
  const { user } = useAuth()
  const firstName = user?.fullName.trim().split(/\s+/)[0]

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-primary">Mi cuenta</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-heading-1 font-bold text-brand-ink">{firstName ? `Hola, ${firstName}` : 'Bienvenido'}</h1>
          {user?.role && <Badge variant="secondary">{user.role}</Badge>}
        </div>
        <p className="mt-2 max-w-2xl text-foreground-muted">Consulta la información de tu cuenta y mantén actualizadas tus credenciales de acceso.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/profile" className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep">
          <Card className="h-full transition-colors group-hover:border-brand-soft"><CardHeader><UserRound className="size-6 text-brand-primary" aria-hidden="true" /><CardTitle>Mi perfil</CardTitle><CardDescription>Consulta tus datos y cambia tu contraseña.</CardDescription></CardHeader></Card>
        </Link>
        <Link to="/" className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep">
          <Card className="h-full transition-colors group-hover:border-brand-soft"><CardHeader><ExternalLink className="size-6 text-brand-primary" aria-hidden="true" /><CardTitle>Ver sitio público</CardTitle><CardDescription>Visita la información pública de la Asociación.</CardDescription></CardHeader></Card>
        </Link>
      </div>
    </div>
  )
}
