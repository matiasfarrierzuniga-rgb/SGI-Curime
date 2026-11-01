import { FileText, HandCoins, Landmark, Wallet } from 'lucide-react'
import { NavLink, useInRouterContext } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { cn } from '@/shared/lib/utils'
import { hasCapability, type AccessCapability } from '@/shared/security/access'

const links: ReadonlyArray<{ label: string; to: string; capability: AccessCapability; alsoRequires?: AccessCapability; icon: typeof Wallet }> = [
  { label: 'Resumen', to: '/app/financial', capability: 'fin.charges.read', alsoRequires: 'fin.movements.read', icon: Landmark },
  { label: 'Cargos y pagos', to: '/app/financial/charges', capability: 'fin.charges.read', icon: Wallet },
  { label: 'Movimientos', to: '/app/financial/movements', capability: 'fin.movements.read', icon: HandCoins },
  { label: 'DINADECO', to: '/app/financial/dinadeco', capability: 'fin.dinadeco.read', icon: FileText },
]

export function FinancialSectionNav() {
  const { user } = useAuth()
  const inRouterContext = useInRouterContext()
  const availableLinks = links.filter((link) => hasCapability(user?.permissionCodes, link.capability) && (!link.alsoRequires || hasCapability(user?.permissionCodes, link.alsoRequires)))

  if (!inRouterContext || availableLinks.length < 2) return null

  return (
    <nav aria-label="Secciones de gestión financiera" className="overflow-x-auto border-b border-border-default pb-4">
      <div className="inline-flex min-w-full items-center gap-1 rounded-control border border-border-default bg-surface-muted p-1 sm:min-w-0">
      {availableLinks.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/app/financial'}
          className={({ isActive }) => cn(
            'group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[0.375rem] px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            isActive
              ? 'bg-surface-card text-brand-primary shadow-sm ring-1 ring-border-default'
              : 'text-text-secondary hover:bg-surface-card/75 hover:text-text-primary',
          )}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}</div>
    </nav>
  )
}
