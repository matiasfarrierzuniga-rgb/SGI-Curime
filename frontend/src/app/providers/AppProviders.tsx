import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
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

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}><BrowserRouter><ErrorBoundary><ToastProvider><AuthProvider>{children}</AuthProvider></ToastProvider><Toaster position="top-right" richColors/></ErrorBoundary></BrowserRouter></QueryClientProvider>
}
