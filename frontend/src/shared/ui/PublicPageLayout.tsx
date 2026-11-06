import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ContentSpacing = 'compact' | 'normal' | 'spacious'

export function PublicPageContent({ children, className = '', spacing = 'normal' }: { children: ReactNode; className?: string; spacing?: ContentSpacing }) {
  const spacingClass = spacing === 'compact'
    ? 'py-6 md:py-8'
    : spacing === 'spacious'
      ? 'py-10 md:py-16'
      : 'py-6 md:py-10'

  return <section className={`public-container ${spacingClass} ${className}`}>{children}</section>
}

export function Breadcrumbs({ current, variant = 'simple' }: { current: string; variant?: 'hero' | 'simple' }) {
  return <nav className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-body-small text-foreground-muted ${variant === 'hero' ? 'py-4 md:py-6' : 'py-4 md:py-6'}`} aria-label="Ruta de navegación"><Link className="shrink-0 rounded-sm font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring" to="/">Inicio</Link><ChevronRight aria-hidden="true" className="size-4 shrink-0 text-foreground-muted" /><span className="min-w-0 break-words" aria-current="page">{current}</span></nav>
}

export function PublicPageHeader({ title, intro, eyebrow = 'ADI Curime · Información institucional', breadcrumb }: { title: string; intro: string; eyebrow?: string; breadcrumb?: string }) {
  return <header className="border-b border-brand-sage/70 bg-surface-muted"><div className="public-container">{breadcrumb && <Breadcrumbs current={breadcrumb} variant="simple" />}<p className="public-eyebrow text-brand-primary">{eyebrow}</p><h1 className="public-heading mt-2 md:mt-3 max-w-3xl text-brand-ink">{title}</h1><p className="mt-3 md:mt-4 max-w-2xl text-body-large leading-relaxed text-foreground-muted">{intro}</p></div></header>
}
