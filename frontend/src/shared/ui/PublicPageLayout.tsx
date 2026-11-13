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
  return <nav className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-body-small text-foreground-secondary ${variant === 'hero' ? 'py-4 md:py-6' : 'py-4 md:py-6'}`} aria-label="Ruta de navegación"><Link className="shrink-0 rounded-sm font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring" to="/">Inicio</Link><ChevronRight aria-hidden="true" className="size-4 shrink-0 text-foreground-secondary" /><span className="min-w-0 break-words" aria-current="page">{current}</span></nav>
}

type PublicHeaderImage = { src: string; mobileSrc?: string; alt: string }

export function PublicPageHeader({ title, intro, eyebrow = 'ADI Curime · Información institucional', breadcrumb, image }: { title: string; intro: string; eyebrow?: string; breadcrumb?: string; image?: PublicHeaderImage }) {
  return <header className="border-b border-border/70 bg-surface-muted">
    <div className={`public-container ${image ? 'pb-8 md:pb-10' : 'pb-7 md:pb-10'}`}>
      {breadcrumb && <Breadcrumbs current={breadcrumb} variant="simple" />}
      <div className={image ? 'grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)] lg:items-center lg:gap-12' : ''}>
        <div className={image ? 'lg:py-6' : ''}>
          <p className="public-eyebrow text-brand-primary">{eyebrow}</p>
          <h1 className="public-heading mt-2 max-w-3xl text-display text-text-primary md:mt-3">{title}</h1>
          <p className="mt-3 max-w-2xl text-pretty text-body-large leading-relaxed text-foreground-secondary md:mt-4">{intro}</p>
        </div>
        {image ? <picture className="block aspect-[16/9] overflow-hidden rounded-surface border border-border/70 bg-surface-page shadow-surface lg:min-h-72">
          {image.mobileSrc ? <source media="(max-width: 767px)" srcSet={image.mobileSrc} type="image/webp" /> : null}
          <img src={image.src} alt={image.alt} width="1500" height="1000" className="size-full object-cover" />
        </picture> : null}
      </div>
    </div>
  </header>
}
