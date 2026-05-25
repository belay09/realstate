import { useSyncExternalStore } from 'react'

import { getAuthSnapshot, subscribeAuth } from '../lib/auth'

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => false)
}

export function useAdminEntryPath(): string {
  const loggedIn = useIsLoggedIn()
  return loggedIn ? '/admin' : '/admin/login'
}
