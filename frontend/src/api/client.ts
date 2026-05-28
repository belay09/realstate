import axios from 'axios'

import { clearAccessToken, getAccessToken } from '../lib/auth'

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const reqUrl = String(error?.config?.url ?? '')
    const isLoginRequest = reqUrl.includes('/auth/login')
    const isAdminRoute = window.location.pathname.startsWith('/admin')
    const isAdminLogin = window.location.pathname === '/admin/login'

    if (status === 401 && !isLoginRequest && isAdminRoute && !isAdminLogin) {
      clearAccessToken()
      window.location.replace('/admin/login')
    }

    return Promise.reject(error)
  },
)
