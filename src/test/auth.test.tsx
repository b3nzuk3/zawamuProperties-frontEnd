// Mocked Axios fixtures, not live auth.
import { act, renderHook, waitFor } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import { AuthProvider } from '@/hooks/useAuth'
import { useAuth } from '@/hooks/useAuthContext'
import api from '@/lib/api'
vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
const owner = { id: 'owner-id', name: 'Owner', email: 'owner@example.test', isAdmin: true }
const ordinary = { ...owner, id: 'reader-id', isAdmin: false }
const hook = () => renderHook(() => useAuth(), { wrapper: AuthProvider })
it('hydrates trusted profile DTO', async () => {
 localStorage.setItem('token', 'fixture')
 vi.mocked(api.get).mockResolvedValueOnce({ data: owner })
 const { result } = hook()
 await waitFor(() => expect(result.current.loading).toBe(false))
 expect(result.current.user).toEqual(owner)
})
it('defaults absent owner flag to false and returns login user', async () => {
 const { isAdmin: _flag, ...legacy } = owner
 vi.mocked(api.post).mockResolvedValueOnce({ data: { token: 'fixture', user: legacy } })
 const { result } = hook()
 let loggedIn
 await act(async () => { loggedIn = await result.current.login('x', 'y') })
 expect(result.current.user?.isAdmin).toBe(false)
 expect(loggedIn).toEqual({ ...legacy, isAdmin: false })
})
it('clears failed hydration token', async () => {
 localStorage.setItem('token', 'expired-fixture')
 vi.mocked(api.get).mockRejectedValueOnce(new Error('unauthorized'))
 const { result } = hook()
 await waitFor(() => expect(result.current.loading).toBe(false))
 expect(localStorage.getItem('token')).toBeNull()
 expect(result.current.user).toBeNull()
})
it.each(['logout', 'replacement', 'replacement-failure'] as const)('ignores late hydration after %s', async operation => {
 localStorage.setItem('token', 'old-fixture')
 let resolve!: (value: { data: typeof owner }) => void
 let reject!: (reason: Error) => void
 const pending = new Promise<{ data: typeof owner }>((yes, no) => { resolve = yes; reject = no })
 vi.mocked(api.get).mockReturnValueOnce(pending)
 const { result } = hook()
 await act(async () => {
   if (operation === 'logout') result.current.logout()
   else {
     vi.mocked(api.post).mockResolvedValueOnce({ data: { token: 'new-fixture', user: ordinary } })
     await result.current.login('x', 'y')
   }
 })
 await act(async () => { if (operation === 'replacement-failure') reject(new Error('old failure')); else resolve({ data: owner }) })
 expect(result.current.user).toEqual(operation === 'logout' ? null : ordinary)
 expect(result.current.loading).toBe(false)
 expect(localStorage.getItem('token')).toBe(operation === 'logout' ? null : 'new-fixture')
})

it.each([false, undefined, 'true'])('fails closed on profile owner flag %s', async isAdmin => {
 localStorage.setItem('token', 'fixture')
 vi.mocked(api.get).mockResolvedValueOnce({ data: { ...owner, isAdmin } })
 const { result } = hook()
 await waitFor(() => expect(result.current.loading).toBe(false))
 expect(result.current.user?.isAdmin).toBe(false)
})
it('rejects malformed legacy profile and clears its token', async () => {
 localStorage.setItem('token', 'legacy-fixture')
 vi.mocked(api.get).mockResolvedValueOnce({ data: { _id: 'legacy-id', isAdmin: true } })
 const { result } = hook()
 await waitFor(() => expect(result.current.loading).toBe(false))
 expect(result.current.user).toBeNull()
 expect(localStorage.getItem('token')).toBeNull()
})
it.each([true, false])('login preserves explicit server owner flag %s', async isAdmin => {
 const expected = { ...owner, isAdmin }
 vi.mocked(api.post).mockResolvedValueOnce({ data: { token: 'login-fixture', user: expected } })
 const { result } = hook()
 await act(async () => { expect(await result.current.login('x', 'y')).toEqual(expected) })
 expect(result.current.user).toEqual(expected)
 expect(localStorage.getItem('token')).toBe('login-fixture')
})
it('ignores a late login response after logout', async () => {
 let resolve!: (value: { data: { token: string; user: typeof owner } }) => void
 vi.mocked(api.post).mockReturnValueOnce(new Promise(yes => { resolve = yes }))
 const { result } = hook()
 let request!: Promise<unknown>
 await act(async () => { request = result.current.login('x', 'y').catch(error => error) })
 act(() => result.current.logout())
 await act(async () => { resolve({ data: { token: 'late-fixture', user: owner } }); await request })
 expect(result.current.user).toBeNull()
 expect(localStorage.getItem('token')).toBeNull()
})
