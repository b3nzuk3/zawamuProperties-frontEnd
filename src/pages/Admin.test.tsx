// Admin alert checks use a mocked Axios transport and never send real email.
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Admin from './Admin'
import api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/properties/PropertyFields', () => ({
  PropertyFields: () => null,
}))

const statsResponse = {
  data: {
    totals: { properties: 0, activeListings: 0, blogPosts: 0, inquiries: 0 },
    monthOverMonth: { properties: 0, activeListings: 0, blogPosts: 0, inquiries: 0 },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  vi.spyOn(window, 'alert').mockImplementation(() => undefined)
  vi.mocked(api.get).mockImplementation(async (path) => (
    path === '/admin/stats' ? statsResponse : { data: [] }
  ) as never)
  vi.mocked(api.post).mockResolvedValue({ status: 200, data: { success: true, data: [] } } as never)
})

describe('admin saved-search alert check', () => {
  it('requires confirmation, sends an explicit POST, and does not parse raw match/email results', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValue({
      status: 200,
      data: { success: true, data: [{ searchId: 'fixture-search', matches: 4 }] },
    } as never)
    render(<MemoryRouter><Admin /></MemoryRouter>)

    const checkButton = await screen.findByRole('button', { name: /Check Property Alerts/i })
    await user.click(checkButton)
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('verified saved search has opted in'))
    expect(api.post).not.toHaveBeenCalled()

    vi.mocked(window.confirm).mockReturnValue(true)
    await user.click(checkButton)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/saved-searches/admin/check-matches', { hoursBack: 24 }))
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Only verified searches with explicit alert consent are eligible'))
  })
})
