// Actual App route wiring; page contents and auth are mocked fixtures.
import { render, screen } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import App from '@/App'
import { useAuth } from '@/hooks/useAuthContext'
vi.mock('@/hooks/useAuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('@/hooks/useAuth', () => ({
 AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/pages/Index', () => ({ default: () => <div>public home</div> }))
vi.mock('@/pages/Listings', () => ({ default: () => <div>public listings</div> }))
vi.mock('@/pages/Blog', () => ({ default: () => null }))
vi.mock('@/pages/PropertyDetails', () => ({ default: () => null }))
vi.mock('@/pages/BlogPost', () => ({ default: () => null }))
vi.mock('@/pages/About', () => ({ default: () => null }))
vi.mock('@/pages/Contact', () => ({ default: () => <div>public contact</div> }))
vi.mock('@/pages/Admin', () => ({ default: () => <div>owner page</div> }))
vi.mock('@/pages/AdminProperties', () => ({ default: () => <div>owner page</div> }))
vi.mock('@/pages/AdminBlog', () => ({ default: () => <div>owner page</div> }))
vi.mock('@/pages/AdminSettings', () => ({ default: () => <div>owner page</div> }))
vi.mock('@/pages/AdminAnalytics', () => ({ default: () => <div>owner page</div> }))
vi.mock('@/pages/AdminViewingRequests', () => ({ default: () => <div>owner page</div> }))
vi.mock('@/pages/AdminEnquiries', () => ({ default: () => <div>owner page</div> }))
vi.mock('@/pages/NotFound', () => ({ default: () => <div>not found</div> }))
vi.mock('@/pages/Login', () => ({ default: () => <div>login destination</div> }))
vi.mock('@/pages/UserDashboard', () => ({ default: () => <div>dashboard destination</div> }))
vi.mock('@/pages/CurrencyConverter', () => ({ default: () => null }))
vi.mock('@/TestMDXEditor', () => ({ default: () => null }))
const paths = ['/admin', '/admin/properties', '/admin/blog', '/admin/settings', '/admin/analytics', '/admin/viewing-requests', '/admin/enquiries']
const user = { id: 'fixture', name: 'Fixture', email: 'fixture@example.test', isAdmin: false }
it.each(paths.flatMap(path => [
 { path, user: null, expected: 'login destination' },
 { path, user, expected: 'dashboard destination' },
 { path, user: { ...user, isAdmin: true }, expected: 'owner page' },
]))('guards actual $path for $expected', ({ path, user, expected }) => {
 window.history.replaceState({}, '', path)
 vi.mocked(useAuth).mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
 render(<App />)
 expect(screen.getByText(expected)).toBeInTheDocument()
})
it.each([['/', 'public home'], ['/listings', 'public listings'], ['/contact', 'public contact']])('keeps %s public', (path, expected) => {
 window.history.replaceState({}, '', path)
 vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as ReturnType<typeof useAuth>)
 render(<App />)
 expect(screen.getByText(expected)).toBeInTheDocument()
})
