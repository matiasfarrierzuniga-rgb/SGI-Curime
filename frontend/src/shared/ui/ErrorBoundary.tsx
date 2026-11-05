import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = { children: ReactNode; pathname?: string }

export function getErrorRecoveryPath(pathname: string): string {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/'

  if (/^\/app\/admin\/assemblies\/[^/]+$/.test(path)) return '/app/admin/assemblies'
  if (path === '/app' || path.startsWith('/app/') || path === '/admin' || path.startsWith('/admin/') || path === '/inventory' || path.startsWith('/inventory/')) return '/app/profile'
  return '/'
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (!this.state.failed) return this.props.children

    const pathname = this.props.pathname ?? (typeof window === 'undefined' ? '/' : window.location.pathname)
    return <main className="auth-page card"><h1>Algo no salió como esperábamos</h1><p>La pantalla encontró un problema inesperado. Puedes volver al lugar anterior e intentarlo de nuevo.</p><a className="button-link primary" href={getErrorRecoveryPath(pathname)}>Ir al inicio</a></main>
  }
}
