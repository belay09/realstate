import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'

import { api } from '../../api/client'
import { getAccessToken, setAccessToken } from '../../lib/auth'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [error, setError] = React.useState<string | null>(null)

  const login = useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const { data } = await api.post<{ access_token: string }>('/auth/login', body)
      return data.access_token
    },
    onSuccess(token) {
      setAccessToken(token)
      setError(null)
      navigate('/admin', { replace: true })
    },
    onError(err: unknown) {
      const ax = err as { response?: { data?: { error?: { message?: string } } } }
      const msg = ax.response?.data?.error?.message ?? 'Login failed'
      setError(msg)
    },
  })

  if (getAccessToken()) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-lg dark:border-stone-800 dark:bg-stone-950">
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50">Admin sign in</h1>
        <p className="mt-1 text-sm text-stone-500">Belay Properties staff</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            login.mutate({
              email: String(fd.get('email')),
              password: String(fd.get('password')),
            })
          }}
        >
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Email
            <input name="email" type="email" required autoComplete="username" className="input" />
          </label>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
            />
          </label>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
