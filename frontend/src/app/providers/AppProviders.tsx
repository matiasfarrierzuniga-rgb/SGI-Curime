import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/features/auth'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { ToastProvider } from '@/shared/ui/Toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

export function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return <ErrorBoundary pathname={pathname}>{children}</ErrorBoundary>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}><BrowserRouter><RoutedErrorBoundary><ToastProvider><AuthProvider>{children}</AuthProvider></ToastProvider></RoutedErrorBoundary></BrowserRouter></QueryClientProvider>
}
