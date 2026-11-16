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
  const spacing = variant === 'hero' ? 'py-4 md:py-5' : 'py-3 md:py-4'
  return <nav className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-body-small text-foreground-secondary ${spacing}`} aria-label="Ruta de navegación"><Link className="shrink-0 rounded-sm font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring" to="/">Inicio</Link><ChevronRight aria-hidden="true" className="size-4 shrink-0 text-foreground-secondary" /><span className="min-w-0 break-words" aria-current="page">{current}</span></nav>
}

type PublicHeaderImage = { src: string; desktopSrc?: string; mobileSrc?: string; alt: string }

type PublicPageHeaderProps = {
  title: string
  intro: string
  eyebrow?: string
  breadcrumb?: string
  image?: PublicHeaderImage
  titleClassName?: string
  actions?: ReactNode
  aside?: ReactNode
  imagePosition?: string
}

export function PublicPageHeader({ title, intro, eyebrow = 'ADI Curime · Información institucional', breadcrumb, image, titleClassName = '', actions, aside, imagePosition = 'object-center' }: PublicPageHeaderProps) {
  return <header className="border-b border-border/70 bg-surface-muted">
    <div className={`public-container ${image ? 'pb-6 md:pb-7' : 'pb-5 md:pb-6'}`}>
      {breadcrumb && <Breadcrumbs current={breadcrumb} variant="simple" />}
      <div className={image ? 'grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)] lg:items-center lg:gap-10' : 'flex flex-wrap items-end justify-between gap-4'}>
        <div className={`min-w-0 ${image ? 'lg:py-2' : ''}`}>
          <p className="public-eyebrow text-brand-primary">{eyebrow}</p>
          <h1 className={`public-heading mt-2 max-w-3xl text-display text-text-primary ${titleClassName}`}>{title}</h1>
          <p className="mt-2.5 max-w-2xl text-pretty text-body-large leading-relaxed text-foreground-secondary">{intro}</p>
          {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {image ? <picture className="block w-full aspect-[16/9] max-h-56 overflow-hidden rounded-surface border border-border/70 bg-surface-page shadow-surface md:max-h-64 lg:max-h-none">
          {image.desktopSrc ? <source media="(min-width: 768px)" srcSet={image.desktopSrc} type="image/webp" /> : null}
          {image.mobileSrc ? <source media="(max-width: 767px)" srcSet={image.mobileSrc} type="image/webp" /> : null}
          <img src={image.src} alt={image.alt} width="1500" height="1000" className={`size-full object-cover ${imagePosition}`} />
        </picture> : aside}
      </div>
    </div>
  </header>
}
