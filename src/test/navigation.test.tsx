// Auth fixtures only; RTL does not perform live authentication.
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { it, expect, vi } from 'vitest'
import Header from '@/components/layout/Header'
import Login from '@/pages/Login'
import { useAuth } from '@/hooks/useAuth'
vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('@/components/layout/Layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
const fixture = { id: 'fixture-id', name: 'Fixture', email: 'fixture@example.test', isAdmin: false }
it.each([
 ['anonymous', null, false, 'Sign In'], ['ordinary', fixture, false, null],
 ['owner', { ...fixture, isAdmin: true }, false, 'Admin'],
 ['missing flag', { id: 'legacy', name: 'Legacy', email: 'legacy@example.test' }, false, null],
 ['loading', null, true, null],
])('desktop and mobile navigation for %s', (_label, user, loading, link) => {
 vi.mocked(useAuth).mockReturnValue({ user, loading } as ReturnType<typeof useAuth>)
 render(<MemoryRouter><Header /></MemoryRouter>)
 expect(screen.queryAllByRole('link', { name: 'Admin' })).toHaveLength(link === 'Admin' ? 1 : 0)
 expect(screen.queryAllByRole('link', { name: 'Sign In' })).toHaveLength(link === 'Sign In' ? 1 : 0)
 fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation' }))
 expect(screen.queryAllByRole('link', { name: 'Admin' })).toHaveLength(link === 'Admin' ? 2 : 0)
 expect(screen.queryAllByRole('link', { name: 'Sign In' })).toHaveLength(link === 'Sign In' ? 2 : 0)
 if (link) screen.getAllByRole('link', { name: link }).forEach(el => expect(el).toHaveAttribute('href', link === 'Admin' ? '/admin' : '/login'))
})
it.each([[true, 'owner destination'], [false, 'ordinary destination']])('login redirects with owner=%s', async (isAdmin, destination) => {
 const login = vi.fn().mockResolvedValue({ ...fixture, isAdmin })
 vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, login, logout: vi.fn() })
 render(<MemoryRouter initialEntries={['/login']}><Routes>
 <Route path="/login" element={<Login />} />
 <Route path="/admin" element={<div>owner destination</div>} />
 <Route path="/dashboard" element={<div>ordinary destination</div>} />
 </Routes></MemoryRouter>)
 const interaction = userEvent.setup()
 await interaction.type(screen.getByLabelText('Email'), 'fixture@example.test')
 await interaction.type(screen.getByLabelText('Password'), 'fixture-password')
 await interaction.click(screen.getByRole('button', { name: 'Login' }))
 expect(await screen.findByText(destination as string)).toBeInTheDocument()
 expect(login).toHaveBeenCalledWith('fixture@example.test', 'fixture-password')
})
