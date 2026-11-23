import { beforeEach, describe, expect, it } from 'vitest'
import {
  SAVED_SEARCH_SESSION_STORAGE_KEY,
  captureSavedSearchAccessLink,
  clearCapturedSavedSearchAccessLink,
  clearStoredSavedSearchSession,
  getStoredSavedSearchSession,
  savedSearchSessionConfig,
  storeSavedSearchSession,
} from './savedSearchApi'

beforeEach(() => {
  window.sessionStorage.clear()
  window.localStorage.clear()
  clearCapturedSavedSearchAccessLink()
  window.history.replaceState({}, '', '/dashboard?tab=searches#')
})

describe('saved-search access proof helpers', () => {
  it('removes an emailed token fragment synchronously without persisting the link token', () => {
    window.history.replaceState({}, '', '/dashboard?tab=searches#saved-search-token=one-time-secret')

    expect(captureSavedSearchAccessLink()).toBe('one-time-secret')
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe('/dashboard?tab=searches')
    expect(window.sessionStorage.length).toBe(0)
    expect(window.localStorage.length).toBe(0)
  })

  it('keeps management proof in its own sessionStorage entry and sends it only as the dedicated header', () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString()
    storeSavedSearchSession({ token: 'management-proof', email: 'visitor@example.test', expiresAt })

    expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).toContain('management-proof')
    expect(window.localStorage.length).toBe(0)
    expect(getStoredSavedSearchSession()).toEqual({
      token: 'management-proof',
      email: 'visitor@example.test',
      expiresAt,
    })
    expect(savedSearchSessionConfig('management-proof')).toEqual({
      headers: { 'X-Saved-Search-Session': 'management-proof' },
    })
  })

  it('clears malformed and expired proof rather than restoring it', () => {
    window.sessionStorage.setItem(SAVED_SEARCH_SESSION_STORAGE_KEY, '{broken')
    expect(getStoredSavedSearchSession()).toBeNull()
    expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).toBeNull()

    window.sessionStorage.setItem(SAVED_SEARCH_SESSION_STORAGE_KEY, JSON.stringify({
      token: 'expired-proof',
      email: 'visitor@example.test',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    }))
    expect(getStoredSavedSearchSession()).toBeNull()
    expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).toBeNull()
  })

  it('clears proof explicitly on logout', () => {
    storeSavedSearchSession({
      token: 'management-proof',
      email: 'visitor@example.test',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    })
    clearStoredSavedSearchSession()
    expect(getStoredSavedSearchSession()).toBeNull()
  })
})
