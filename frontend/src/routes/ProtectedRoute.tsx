import { Navigate, Outlet } from 'react-router-dom'

import { getAccessToken } from '../lib/auth'

export function ProtectedRoute() {
  if (!getAccessToken()) {
    return <Navigate to="/admin/login" replace />
  }
  return <Outlet />
}
