// Mocked auth fixtures; not live authorization.
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { it, expect, vi } from 'vitest'
import AdminRoute from '@/components/auth/AdminRoute'
import { useAuth } from '@/hooks/useAuth'
vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }))
it.each([
  ['anonymous', null, false, 'login'], ['loading', null, true, 'Loading...'],
  ['ordinary', { isAdmin: false }, false, 'dashboard'],
  ['missing flag', {}, false, 'dashboard'], ['owner', { isAdmin: true }, false, 'owner page'],
])('guards %s', (_label, user, loading, expected) => {
  vi.mocked(useAuth).mockReturnValue({ user, loading } as ReturnType<typeof useAuth>)
  render(<MemoryRouter initialEntries={['/admin']}><Routes>
    <Route path="/admin" element={<AdminRoute><div>owner page</div></AdminRoute>} />
    <Route path="/login" element={<div>login</div>} />
    <Route path="/dashboard" element={<div>dashboard</div>} />
  </Routes></MemoryRouter>)
  expect(screen.getByText(expected as string)).toBeInTheDocument()
})
