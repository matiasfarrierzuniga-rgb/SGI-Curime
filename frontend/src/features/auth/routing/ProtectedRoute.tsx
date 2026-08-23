import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../model/AuthContext'
export function ProtectedRoute() { const auth = useAuth(); const location = useLocation(); if (auth.isLoading) return <p className="container">Restaurando sesión…</p>; return auth.isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} /> }
