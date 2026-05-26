import { Navigate, Route, Routes } from 'react-router-dom'

import { AdminLayout } from './layout/AdminLayout'
import { PublicLayout } from './layout/PublicLayout'
import { HomePage } from './pages/HomePage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { AyatCalculatorPage } from './pages/AyatCalculatorPage'
import { ListingsPage } from './pages/ListingsPage'
import { AdminBlocksPage } from './pages/admin/AdminBlocksPage'
import { AdminCompaniesPage } from './pages/admin/AdminCompaniesPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminContractsPage } from './pages/admin/AdminContractsPage'
import { AdminLeadsPage } from './pages/admin/AdminLeadsPage'
import { AdminListingsPage } from './pages/admin/AdminListingsPage'
import { AdminPricingPage } from './pages/admin/AdminPricingPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminPaymentPlansPage } from './pages/admin/AdminPaymentPlansPage'
import { AdminQuotesPage } from './pages/admin/AdminQuotesPage'
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage'
import { AdminUnitTypesPage } from './pages/admin/AdminUnitTypesPage'
import { AdminUnitsPage } from './pages/admin/AdminUnitsPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="listings/:slug" element={<ListingDetailPage />} />
        <Route path="calculator" element={<AyatCalculatorPage />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="companies" element={<AdminCompaniesPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="blocks" element={<AdminBlocksPage />} />
          <Route path="unit-types" element={<AdminUnitTypesPage />} />
          <Route path="units" element={<AdminUnitsPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="payment-plans" element={<AdminPaymentPlansPage />} />
          <Route path="quotes" element={<AdminQuotesPage />} />
          <Route path="leads" element={<AdminLeadsPage />} />
          <Route path="pricing" element={<AdminPricingPage />} />
          <Route path="contracts" element={<AdminContractsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
