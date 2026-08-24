import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './tailwind.css'
import './index.css'
import App from './app/App'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/features/auth'
import { ToastProvider } from '@/shared/ui/Toast'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
