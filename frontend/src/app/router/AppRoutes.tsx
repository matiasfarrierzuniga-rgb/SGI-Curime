import { Route, Routes } from 'react-router-dom'
import { ManagementRoute, ProtectedRoute } from '@/features/auth'
import { RoleRoute } from '@/features/auth'
import { AffiliatesPage } from '@/features/affiliates'
import { EventsManagementPage, PublicEventDetailPage, PublicEventsPage } from '@/features/events'
import { AffiliateRequestsPage } from '@/features/affiliate-requests'
import { AccessLayout } from '@/app/layouts/AccessLayout'
import { ErpLayout } from '@/app/layouts/ErpLayout'
import { AccountLayout } from '@/app/layouts/AccountLayout'
import { ForgotPasswordPage } from '@/features/auth'
import { LoginPage } from '@/features/auth'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RegisterPage } from '@/features/auth'
import { TokenPasswordPage } from '@/features/auth'
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage'
import { UserRequestsPage } from '@/pages/admin/UserRequestsPage'
import { UsersPage } from '@/features/users'
import { InventoryAlertsPage } from '@/pages/inventory/InventoryAlertsPage'
import { InventoryCategoriesPage } from '@/pages/inventory/InventoryCategoriesPage'
import { InventoryDashboardPage } from '@/pages/inventory/InventoryDashboardPage'
import { InventoryItemsPage } from '@/pages/inventory/InventoryItemsPage'
import { InventoryLoansPage } from '@/pages/inventory/InventoryLoansPage'
import { InventoryMovementsPage } from '@/pages/inventory/InventoryMovementsPage'
import { InventoryReportsPage } from '@/pages/inventory/InventoryReportsPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { AboutPage, CommunityPage, ContactPage, NewsDetailPage, NewsPage, ServicesPage, TransparencyPage } from '@/pages/public/PublicPages'
import { AffiliationPage } from '@/pages/public/AffiliationPage'
import { LandingPage } from '@/features/public-site'
import { AppHomePage } from '@/pages/erp/AppHomePage'
import { ErpPlaceholderPage } from '@/pages/erp/ErpPlaceholderPage'
import { AccountHomePage } from '@/pages/account/AccountHomePage'
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/nosotros" element={<AboutPage />} />
        <Route path="/comunidad" element={<CommunityPage />} />
        <Route path="/noticias" element={<NewsPage />} />
        <Route path="/noticias/:slug" element={<NewsDetailPage />} />
        <Route path="/eventos" element={<PublicEventsPage />} />
        <Route path="/eventos/:publicId" element={<PublicEventDetailPage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/transparencia" element={<TransparencyPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/afiliacion" element={<AffiliationPage />} />
      </Route>
      <Route element={<AccessLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/activate-account" element={<TokenPasswordPage mode="activate" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<TokenPasswordPage mode="reset" />} />
      </Route>
      <Route path="/403" element={<ForbiddenPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AccountLayout />}>
          <Route element={<RoleRoute capability="usr.profile.read" />}>
            <Route path="/mi-cuenta" element={<AccountHomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route element={<ManagementRoute />}>
          <Route element={<ErpLayout />}>
            <Route path="/app" element={<AppHomePage />} />
          <Route element={<RoleRoute capability="usr.users.read" />}>
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>
          <Route element={<RoleRoute capability="usr.roles.read" />}>
            <Route path="/app/roles" element={<ErpPlaceholderPage title="Roles" />} />
          </Route>
          <Route element={<RoleRoute capability="adm.affiliates.read" />}>
            <Route path="/app/admin/affiliates" element={<AffiliatesPage />} />
          </Route>
          <Route element={<RoleRoute capability="adm.requests.read" />}>
            <Route path="/app/admin/requests" element={<AffiliateRequestsPage />} />
            <Route path="/admin/user-requests" element={<UserRequestsPage />} />
          </Route>
          <Route element={<RoleRoute capability="aud.logs.read" />}>
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          </Route>
          <Route element={<RoleRoute capability="pub.events.manage" />}>
            <Route path="/app/events" element={<EventsManagementPage />} />
          </Route>
          <Route element={<RoleRoute capability="inv.inventory.read" />}>
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
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
