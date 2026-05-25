const TOKEN_KEY = 'bp_access_token'
const AUTH_CHANGE = 'bp-auth-change'

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event(AUTH_CHANGE))
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGE))
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken())
}

export function adminEntryPath(): string {
  return isLoggedIn() ? '/admin' : '/admin/login'
}

function subscribeAuth(callback: () => void): () => void {
  window.addEventListener(AUTH_CHANGE, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(AUTH_CHANGE, callback)
    window.removeEventListener('storage', callback)
  }
}

/** Reactive login state for nav links (avoids stale /admin/login after sign-in). */
export function getAuthSnapshot(): boolean {
  return isLoggedIn()
}

export { subscribeAuth }
