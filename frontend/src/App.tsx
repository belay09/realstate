import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import { AdminLayout } from './layout/AdminLayout'
import { PublicLayout } from './layout/PublicLayout'
import { HomePage } from './pages/HomePage'
import { DeveloperKindPage } from './pages/DeveloperKindPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { AyatCalculatorPage } from './pages/AyatCalculatorPage'
import { ApartmentsPage } from './pages/ApartmentsPage'
import { ProjectListingsPage } from './pages/ProjectListingsPage'
import { ShopLocationsPage } from './pages/ShopLocationsPage'
import { ShopLocationPage } from './pages/ShopLocationPage'
import { AdminCompaniesPage } from './pages/admin/AdminCompaniesPage'
import { AdminLeadsPage } from './pages/admin/AdminLeadsPage'
import { AdminListingsPage } from './pages/admin/AdminListingsPage'
import { AdminPropertyListingsPage } from './pages/admin/AdminPropertyListingsPage'
import { AdminPricingPage } from './pages/admin/AdminPricingPage'
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { SHOW_ADMIN_ADVANCED } from './lib/featureFlags'
import { ProtectedRoute } from './routes/ProtectedRoute'

function LegacyProjectRedirect() {
  const { projectSlug } = useParams<{ projectSlug: string }>()
  return <Navigate to={`/apartments/${projectSlug ?? ''}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="developers/:companySlug" element={<DeveloperKindPage />} />
        <Route path="apartments" element={<ApartmentsPage />} />
        <Route path="apartments/:projectSlug" element={<ProjectListingsPage />} />
        <Route path="shops" element={<ShopLocationsPage />} />
        <Route path="shops/:zoneId" element={<ShopLocationPage />} />
        <Route path="listings" element={<Navigate to="/apartments" replace />} />
        <Route path="listings/project/:projectSlug" element={<LegacyProjectRedirect />} />
        <Route path="listings/:slug" element={<ListingDetailPage />} />
        <Route path="calculator" element={<AyatCalculatorPage />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/companies" replace />} />
          <Route path="companies" element={<AdminCompaniesPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="leads" element={<AdminLeadsPage />} />
          <Route path="pricing" element={<AdminPricingPage />} />
          {/* Phase4+ slim: Properties / Promotions - restore via SHOW_ADMIN_ADVANCED */}
          {SHOW_ADMIN_ADVANCED ? (
            <>
              <Route path="properties" element={<AdminPropertyListingsPage />} />
              <Route path="promotions" element={<AdminPromotionsPage />} />
            </>
          ) : null}
          <Route path="*" element={<Navigate to="/admin/companies" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
