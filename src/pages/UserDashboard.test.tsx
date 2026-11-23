// All API responses and transports here are mocks; no email provider or backend is contacted.
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UserDashboard from './UserDashboard'
import { savedSearchApi } from '@/lib/savedSearchApi'
import {
  SAVED_SEARCH_SESSION_STORAGE_KEY,
  clearCapturedSavedSearchAccessLink,
  storeSavedSearchSession,
} from '@/lib/savedSearchApi'

vi.mock('@/lib/savedSearchApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/savedSearchApi')>()
  return {
    ...actual,
    savedSearchApi: {
      ...actual.savedSearchApi,
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  }
})

const accessSession = {
  token: 'verified-session-token',
  email: 'visitor@example.test',
  expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
}

const savedSearchFixture = {
  _id: 'search-old',
  name: 'Old result',
  searchCriteria: {},
  alertSettings: { isActive: false, frequency: 'daily', maxAlertsPerDay: 5 },
  totalAlertsSent: 0,
  createdAt: '2026-11-23T00:00:00.000Z',
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  window.sessionStorage.clear()
  window.localStorage.clear()
  clearCapturedSavedSearchAccessLink()
  window.history.replaceState({}, '', '/dashboard')
  vi.spyOn(savedSearchApi, 'get').mockResolvedValue({ data: { success: true, data: [] } } as never)
  vi.spyOn(savedSearchApi, 'post').mockResolvedValue({
    status: 202,
    data: { success: true, message: 'Request accepted.' },
  } as never)
  vi.spyOn(savedSearchApi, 'delete').mockResolvedValue({ status: 204, data: undefined } as never)
})

describe('guest saved-search access', () => {
  it('serializes confirmation before React rerenders and cannot store proof after unmount', async () => {
    window.history.replaceState({}, '', '/dashboard#saved-search-token=one-time-link-secret')
    let resolveConfirmation: ((response: unknown) => void) | undefined
    vi.mocked(savedSearchApi.post).mockImplementation(() => new Promise(resolve => { resolveConfirmation = resolve }) as never)
    const view = render(<UserDashboard />)
    const confirm = screen.getByRole('button', { name: 'Confirm email access' })
    act(() => {
      confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(savedSearchApi.post).toHaveBeenCalledTimes(1)
    view.unmount()
    await act(async () => {
      resolveConfirmation?.({ status: 200, data: { success: true, data: accessSession } })
      await Promise.resolve()
    })
    expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).toBeNull()
  })

  it('clears local proof immediately but reports a failed server revocation honestly', async () => {
    storeSavedSearchSession(accessSession)
    vi.mocked(savedSearchApi.delete).mockRejectedValueOnce(new Error('offline fixture'))
    const user = userEvent.setup()
    render(<UserDashboard />)
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).toBeNull()
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not confirm server-side revocation/i)
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
  })

  it('treats entered email only as an access-link request, not as dashboard authority', async () => {
    const user = userEvent.setup()
    render(<UserDashboard />)

    await user.type(screen.getByLabelText('Email address'), 'visitor@example.test')
    expect(screen.queryByText('No saved searches')).not.toBeInTheDocument()
    expect(savedSearchApi.get).not.toHaveBeenCalled()
    expect(savedSearchApi.post).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Email me a verification link' }))
    await screen.findByRole('status')
    expect(savedSearchApi.post).toHaveBeenCalledWith('/saved-searches/access-links', {
      email: 'visitor@example.test',
    })
    expect(savedSearchApi.get).not.toHaveBeenCalled()
    expect(screen.getByText(/does not confirm access/i)).toBeInTheDocument()
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })

  it('ignores an access-link response after the requested email changes', async () => {
    const user = userEvent.setup()
    let resolveRequest: ((response: unknown) => void) | undefined
    vi.mocked(savedSearchApi.post).mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve }) as never)
    render(<UserDashboard />)

    const emailInput = screen.getByLabelText('Email address')
    await user.type(emailInput, 'first@example.test')
    await user.click(screen.getByRole('button', { name: 'Email me a verification link' }))
    await user.clear(emailInput)
    await user.type(emailInput, 'second@example.test')
    await act(async () => {
      resolveRequest?.({ status: 202, data: { success: true, message: 'Accepted.' } })
      await Promise.resolve()
    })

    expect(screen.queryByText(/If an access link can be issued/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(savedSearchApi.post).toHaveBeenCalledWith('/saved-searches/access-links', { email: 'first@example.test' })
  })

  it('lets an invalid access link return to the request form without a reload', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/dashboard#saved-search-token=expired-link')
    vi.mocked(savedSearchApi.post).mockImplementation(async (path) => {
      if (path === '/saved-searches/access-links/consume') throw { response: { status: 401 } }
      if (path === '/saved-searches/access-links') {
        return { status: 202, data: { success: true, message: 'Request accepted.' } } as never
      }
      throw new Error(`Unexpected mocked request: ${path}`)
    })
    render(<UserDashboard />)

    await user.click(screen.getByRole('button', { name: 'Confirm email access' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or expired/i)
    await user.click(screen.getByRole('button', { name: 'Request another access link' }))

    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('expired-link')
    await user.type(screen.getByLabelText('Email address'), 'visitor@example.test')
    await user.click(screen.getByRole('button', { name: 'Email me a verification link' }))
    expect(await screen.findByRole('status')).toHaveTextContent(/check its inbox/i)
    expect(savedSearchApi.post).toHaveBeenCalledWith('/saved-searches/access-links', {
      email: 'visitor@example.test',
    })
  })

  it('ignores a consume response that arrives after requesting another access link', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/dashboard#saved-search-token=one-time-link')
    let resolveConsume: ((response: unknown) => void) | undefined
    vi.mocked(savedSearchApi.post).mockImplementation((path) => {
      if (path === '/saved-searches/access-links/consume') {
        return new Promise((resolve) => { resolveConsume = resolve }) as never
      }
      if (path === '/saved-searches/access-links') {
        return Promise.resolve({ status: 202, data: { success: true, message: 'Request accepted.' } }) as never
      }
      throw new Error(`Unexpected mocked request: ${path}`)
    })
    render(<UserDashboard />)

    await user.click(screen.getByRole('button', { name: 'Confirm email access' }))
    expect(screen.getByRole('button', { name: 'Confirming…' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Request another access link' }))
    await user.type(screen.getByLabelText('Email address'), 'visitor@example.test')
    await user.click(screen.getByRole('button', { name: 'Email me a verification link' }))
    expect(await screen.findByRole('status')).toBeInTheDocument()

    await act(async () => {
      resolveConsume?.({ status: 200, data: { success: true, data: accessSession } })
      await Promise.resolve()
    })
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.queryByText('No saved searches')).not.toBeInTheDocument()
    expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).toBeNull()
    expect(savedSearchApi.get).not.toHaveBeenCalled()
  })

  it('clears the fragment before network use and waits for an explicit consume confirmation', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/dashboard?from=email#saved-search-token=one-time-link-secret')
    vi.mocked(savedSearchApi.post).mockImplementation(async (path) => {
      if (path === '/saved-searches/access-links/consume') {
        return { status: 200, data: { success: true, data: accessSession } } as never
      }
      throw new Error(`Unexpected mocked request: ${path}`)
    })
    render(<UserDashboard />)

    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/dashboard?from=email')
    expect(screen.getByRole('button', { name: 'Confirm email access' })).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('one-time-link-secret')
    expect(savedSearchApi.post).not.toHaveBeenCalled()
    expect(savedSearchApi.get).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirm email access' }))
    await screen.findByText('No saved searches')

    expect(savedSearchApi.post).toHaveBeenCalledWith('/saved-searches/access-links/consume', {
      token: 'one-time-link-secret',
    })
    expect(savedSearchApi.get).toHaveBeenCalledWith('/saved-searches?page=1&limit=20', {
      headers: { 'X-Saved-Search-Session': accessSession.token },
    })
    expect(JSON.parse(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY) || 'null')).toEqual(accessSession)
    expect(window.localStorage.length).toBe(0)
  })

  it('revokes the current session on logout and ignores a list response that finishes afterward', async () => {
    const user = userEvent.setup()
    storeSavedSearchSession(accessSession)
    let resolveList: ((response: unknown) => void) | undefined
    vi.mocked(savedSearchApi.get).mockImplementation(() => new Promise((resolve) => { resolveList = resolve }) as never)
    render(<UserDashboard />)

    await user.click(screen.getByRole('button', { name: 'Log out' }))
    expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).toBeNull()
    expect(savedSearchApi.delete).toHaveBeenCalledWith('/saved-searches/session', {
      headers: { 'X-Saved-Search-Session': accessSession.token },
    })
    expect(await screen.findByRole('button', { name: 'Email me a verification link' })).toBeInTheDocument()

    resolveList?.({ data: { success: true, data: [{ ...savedSearchFixture, name: 'Stale private result' }] } })
    await waitFor(() => expect(screen.queryByText('Stale private result')).not.toBeInTheDocument())
  })

  it('clears stored proof and returns to email-link request after a management 401', async () => {
    storeSavedSearchSession(accessSession)
    vi.mocked(savedSearchApi.get).mockRejectedValueOnce({ response: { status: 401 } })
    render(<UserDashboard />)

    expect(await screen.findByLabelText('Email address')).toBeInTheDocument()
    expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).toBeNull()
  })

  it('does not expire a 30-day session early when its timeout exceeds the browser limit', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-11-23T00:00:00.000Z')
    vi.setSystemTime(start)
    const expiresAt = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    storeSavedSearchSession({ ...accessSession, expiresAt })

    try {
      render(<UserDashboard />)
      await act(async () => { await vi.advanceTimersByTimeAsync(2_147_483_647) })
      expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).not.toBeNull()
      expect(screen.getByText(accessSession.email)).toBeInTheDocument()

      const remaining = Date.parse(expiresAt) - Date.now()
      expect(remaining).toBeGreaterThan(1)
      await act(async () => { await vi.advanceTimersByTimeAsync(remaining - 1) })
      expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).not.toBeNull()
      expect(screen.getByText(accessSession.email)).toBeInTheDocument()

      await act(async () => { await vi.advanceTimersByTimeAsync(1) })
      expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).toBeNull()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('discards an expired stored session before requesting any saved-search data', () => {
    window.sessionStorage.setItem(SAVED_SEARCH_SESSION_STORAGE_KEY, JSON.stringify({
      ...accessSession,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    }))
    render(<UserDashboard />)

    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(window.sessionStorage.getItem(SAVED_SEARCH_SESSION_STORAGE_KEY)).toBeNull()
    expect(savedSearchApi.get).not.toHaveBeenCalled()
  })
})
