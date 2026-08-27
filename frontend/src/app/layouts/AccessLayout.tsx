import { ArrowLeft } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AccessLayout() {
  return (
    <div className="min-h-dvh bg-brand-ivory px-4 py-5 font-body text-brand-ink sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-5 flex items-center justify-between gap-4">
          <Link to="/" className="font-display text-xl text-brand-deep no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep">SGI-Curime</Link>
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-brand-deep no-underline hover:bg-brand-soft/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep">
            <ArrowLeft className="size-4" aria-hidden="true" /> Volver al sitio
          </Link>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
