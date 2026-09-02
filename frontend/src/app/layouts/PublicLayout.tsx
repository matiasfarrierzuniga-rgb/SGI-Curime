import { Outlet } from 'react-router-dom'
import { PublicFooter, PublicHeader, PublicScrollRestoration } from '@/features/public-site'

export function PublicLayout() {
  const focusMainContent = () => {
    document.getElementById('public-content')?.focus()
  }

  return (
    <>
      <PublicScrollRestoration />
      <a className="fixed top-4 left-4 z-[100] -translate-y-[200%] rounded-control bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-transform focus:translate-y-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring" href="#public-content" onClick={focusMainContent}>
        Saltar al contenido
      </a>
      <PublicHeader />
      <main id="public-content" className="public-main" tabIndex={-1}>
        <Outlet />
      </main>
      <PublicFooter />
    </>
  )
}
