import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import { AdminLayout } from './layout/AdminLayout'
import { PublicLayout } from './layout/PublicLayout'
import { HomePage } from './pages/HomePage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { AyatCalculatorPage } from './pages/AyatCalculatorPage'
import { ApartmentsPage } from './pages/ApartmentsPage'
import { ProjectListingsPage } from './pages/ProjectListingsPage'
import { ShopLocationsPage } from './pages/ShopLocationsPage'
import { ShopLocationPage } from './pages/ShopLocationPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminLeadsPage } from './pages/admin/AdminLeadsPage'
import { AdminListingsPage } from './pages/admin/AdminListingsPage'
import { AdminPricingPage } from './pages/admin/AdminPricingPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
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
          <Route index element={<AdminDashboardPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="leads" element={<AdminLeadsPage />} />
          <Route path="pricing" element={<AdminPricingPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
