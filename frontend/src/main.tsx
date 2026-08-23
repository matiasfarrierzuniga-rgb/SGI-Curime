import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/features/auth'
import { ToastProvider } from '@/shared/ui/Toast'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
