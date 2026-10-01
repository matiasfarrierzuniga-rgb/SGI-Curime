import { FileText, HandCoins, Wallet } from 'lucide-react'
import { NavLink, useInRouterContext } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { cn } from '@/shared/lib/utils'
import { hasCapability, type AccessCapability } from '@/shared/security/access'

const links: ReadonlyArray<{ label: string; description: string; to: string; capability: AccessCapability; icon: typeof Wallet }> = [
  { label: 'Cargos', description: 'Reservas y pagos', to: '/app/financial', capability: 'fin.charges.read', icon: Wallet },
  { label: 'Movimientos', description: 'Ingresos y egresos', to: '/app/financial/movements', capability: 'fin.movements.read', icon: HandCoins },
  { label: 'DINADECO', description: 'Preparación anual', to: '/app/financial/dinadeco', capability: 'fin.dinadeco.read', icon: FileText },
]

export function FinancialSectionNav() {
  const { user } = useAuth()
  const inRouterContext = useInRouterContext()
  const availableLinks = links.filter((link) => hasCapability(user?.permissionCodes, link.capability))

  if (!inRouterContext || availableLinks.length < 2) return null

  return (
    <nav aria-label="Secciones de gestión financiera" className="grid gap-2 border-b border-border-default pb-5 sm:grid-cols-3">
      {availableLinks.map(({ label, description, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/app/financial'}
          className={({ isActive }) => cn(
            'group flex min-h-16 items-center gap-3 rounded-control border px-3 py-2.5 transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            isActive
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border-default bg-surface-card text-text-primary hover:border-border-strong hover:bg-surface-muted',
          )}
        >
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          <span className="min-w-0"><span className="block text-sm font-bold">{label}</span><span className="block text-xs opacity-75">{description}</span></span>
        </NavLink>
      ))}
    </nav>
  )
}
