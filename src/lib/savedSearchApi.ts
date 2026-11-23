import axios, { type AxiosRequestConfig } from 'axios'

// This isolated client deliberately has no admin-JWT interceptor.
export const savedSearchApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export const SAVED_SEARCH_SESSION_STORAGE_KEY = 'zawamu.saved-search.session'

export interface SavedSearchSession {
  token: string
  email: string
  expiresAt: string
}

let capturedAccessLinkToken: string | null = null

export function captureSavedSearchAccessLink(): string | null {
  if (typeof window === 'undefined') return capturedAccessLinkToken

  const fragment = window.location.hash
  if (fragment) {
    const token = new URLSearchParams(fragment.slice(1)).get('saved-search-token')
    if (token) {
      capturedAccessLinkToken = token
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}`,
      )
    }
  }

  return capturedAccessLinkToken
}

export function clearCapturedSavedSearchAccessLink(): void {
  capturedAccessLinkToken = null
}

export function savedSearchSessionConfig(token: string): AxiosRequestConfig {
  return { headers: { 'X-Saved-Search-Session': token } }
}

export function getStoredSavedSearchSession(): SavedSearchSession | null {
  const raw = window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid session')
    const session = parsed as Partial<SavedSearchSession>
    if (
      typeof session.token !== 'string' || !session.token ||
      typeof session.email !== 'string' || !session.email ||
      typeof session.expiresAt !== 'string' ||
      !Number.isFinite(Date.parse(session.expiresAt)) ||
      Date.parse(session.expiresAt) <= Date.now()
    ) {
      throw new Error('Invalid or expired session')
    }
    return {
      token: session.token,
      email: session.email,
      expiresAt: session.expiresAt,
    }
  } catch {
    clearStoredSavedSearchSession()
    return null
  }
}

export function storeSavedSearchSession(session: SavedSearchSession): void {
  if (Date.parse(session.expiresAt) <= Date.now()) {
    clearStoredSavedSearchSession()
    return
  }
  window.sessionStorage.setItem(SAVED_SEARCH_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSavedSearchSession(): void {
  window.sessionStorage.removeItem(SAVED_SEARCH_SESSION_STORAGE_KEY)
}

export function isSavedSearchUnauthorized(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('response' in error)) return false
  const response = (error as { response?: { status?: unknown } }).response
  return response?.status === 401
}
