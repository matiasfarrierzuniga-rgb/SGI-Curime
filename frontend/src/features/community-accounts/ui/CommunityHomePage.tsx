import { Link } from 'react-router-dom'
import { buttonVariants } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

export function CommunityHomePage() {
  return <main className="container space-y-8 py-8 sm:py-12"><section className="max-w-2xl"><p className="public-eyebrow text-brand-primary">Mi Comunidad</p><h1 className="mt-2 text-balance font-heading text-heading-1 font-bold text-brand-deep">Bienvenido a Mi Comunidad</h1><p className="mt-3 text-pretty text-body text-text-secondary">Su cuenta comunitaria está activa. La afiliación y los servicios institucionales se tramitan por procesos independientes.</p></section><section aria-label="Servicios disponibles" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CommunityService title="Mi perfil" description="Consulte datos de cuenta y actualice su contraseña." to="/profile" action="Ir a mi perfil" /><CommunityService title="Reservar espacio" description="Solicite una reserva mediante el servicio comunitario disponible." to="/servicios/reservas" action="Solicitar reserva" /><CommunityService title="Voluntariado" description="Consulte oportunidades comunitarias abiertas y postúlese sin acceso ERP." to="/voluntariado" action="Ver oportunidades" /></section></main>
}

function CommunityService({ title, description, to, action }: { title: string; description: string; to: string; action: string }) {
  return <Card className="flex min-h-48 flex-col"><CardContent className="flex flex-1 flex-col gap-3 pt-5"><h2 className="text-heading-3 font-semibold text-text-primary">{title}</h2><p className="text-pretty text-body-small text-text-secondary">{description}</p><Link className={`${buttonVariants({ variant: 'outline' })} mt-auto self-start`} to={to}>{action}</Link></CardContent></Card>
}
