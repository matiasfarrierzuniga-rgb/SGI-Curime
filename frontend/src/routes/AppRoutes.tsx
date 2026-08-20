import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { RoleRoute } from '../auth/RoleRoute'
import { AppLayout } from '../layouts/AppLayout'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProfilePage } from '../pages/ProfilePage'
import { RegisterPage } from '../pages/RegisterPage'
import { TokenPasswordPage } from '../pages/TokenPasswordPage'
import { AuditLogsPage } from '../pages/admin/AuditLogsPage'
import { UserRequestsPage } from '../pages/admin/UserRequestsPage'
import { UsersPage } from '../pages/admin/UsersPage'
import { InventoryAlertsPage } from '../pages/inventory/InventoryAlertsPage'
import { InventoryCategoriesPage } from '../pages/inventory/InventoryCategoriesPage'
import { InventoryDashboardPage } from '../pages/inventory/InventoryDashboardPage'
import { InventoryItemsPage } from '../pages/inventory/InventoryItemsPage'
import { InventoryLoansPage } from '../pages/inventory/InventoryLoansPage'
import { InventoryMovementsPage } from '../pages/inventory/InventoryMovementsPage'
import { InventoryReportsPage } from '../pages/inventory/InventoryReportsPage'
import { ForbiddenPage } from '../pages/ForbiddenPage'
import { PublicLayout } from '../layouts/PublicLayout'
import { AboutPage, AppHomePage, CommunityPage, ContactPage, EventsPage, HomePage, NewsDetailPage, NewsPage, ServicesPage, TransparencyPage } from '../pages/public/PublicPages'
const INVENTORY_ROLES = ['Administrador', 'Gestor de Inventario']
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/nosotros" element={<AboutPage />} />
        <Route path="/comunidad" element={<CommunityPage />} />
        <Route path="/noticias" element={<NewsPage />} />
        <Route path="/noticias/:slug" element={<NewsDetailPage />} />
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/transparencia" element={<TransparencyPage />} />
        <Route path="/contacto" element={<ContactPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate-account" element={<TokenPasswordPage mode="activate" />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<TokenPasswordPage mode="reset" />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<AppHomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<RoleRoute role="Administrador" />}>
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/user-requests" element={<UserRequestsPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          </Route>
          <Route element={<RoleRoute role={INVENTORY_ROLES} />}>
            <Route path="/inventory" element={<InventoryDashboardPage />} />
            <Route path="/inventory/items" element={<InventoryItemsPage />} />
            <Route path="/inventory/categories" element={<InventoryCategoriesPage />} />
            <Route path="/inventory/movements" element={<InventoryMovementsPage />} />
            <Route path="/inventory/loans" element={<InventoryLoansPage />} />
            <Route path="/inventory/alerts" element={<InventoryAlertsPage />} />
            <Route path="/inventory/reports" element={<InventoryReportsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}