// The saved-search HTTP client is mocked with Vitest spies; no external service is contacted.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SaveSearchModal } from './save-search-modal'
import { savedSearchApi, storeSavedSearchSession } from '@/lib/savedSearchApi'

vi.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }))

const criteria = {
  location: 'Nairobi',
  listingPurpose: 'rent' as const,
  propertyTypes: ['Apartment'],
  minPrice: 0,
  maxPrice: 80_000,
}

const verifiedSession = {
  token: 'modal-session-proof',
  email: 'verified@example.test',
  expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
}

beforeEach(() => {
  vi.restoreAllMocks()
  window.sessionStorage.clear()
  vi.spyOn(savedSearchApi, 'post').mockResolvedValue({ status: 202, data: { success: true, message: 'Accepted.' } } as never)
})

describe('SaveSearchModal email-verification boundary', () => {
  it('saves a guest request with alerts disabled, then separately requests a verification link', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<SaveSearchModal open onOpenChange={onOpenChange} searchCriteria={criteria} />)

    await user.type(screen.getByLabelText('Search Name *'), 'Nairobi rentals')
    await user.type(screen.getByLabelText('Full Name *'), 'Guest Visitor')
    await user.type(screen.getByLabelText('Email Address *'), 'guest@example.test')
    expect(screen.queryByRole('checkbox', { name: 'Enable email alerts for this search' })).not.toBeInTheDocument()
    expect(screen.getByText(/Email alerts are disabled until you verify/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save Search' }))
    expect(await screen.findByText(/pending email verification/i)).toBeInTheDocument()
    expect(savedSearchApi.post).toHaveBeenCalledWith('/saved-searches', expect.objectContaining({
      userEmail: 'guest@example.test',
      alertSettings: expect.objectContaining({ isActive: false }),
    }), undefined)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    await user.click(screen.getByRole('button', { name: 'Request verification email' }))
    expect(await screen.findByRole('status')).toHaveTextContent(/does not confirm access/i)
    expect(savedSearchApi.post).toHaveBeenLastCalledWith('/saved-searches/access-links', {
      email: 'guest@example.test',
    })
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })

  it('uses only the verified session proof and requires a separate per-search alert opt-in', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    storeSavedSearchSession(verifiedSession)
    vi.mocked(savedSearchApi.post).mockResolvedValue({ status: 201, data: { success: true, data: {} } } as never)
    render(<SaveSearchModal open onOpenChange={onOpenChange} searchCriteria={criteria} />)

    expect(await screen.findByLabelText('Verified email address')).toHaveTextContent(verifiedSession.email)
    expect(screen.getByRole('checkbox', { name: 'Enable email alerts for this search' })).not.toBeChecked()
    await user.type(screen.getByLabelText('Search Name *'), 'Verified search')
    await user.type(screen.getByLabelText('Full Name *'), 'Verified Visitor')
    await user.click(screen.getByRole('checkbox', { name: 'Enable email alerts for this search' }))
    await user.click(screen.getByRole('button', { name: 'Save Search' }))

    expect(await screen.findByRole('heading', { name: 'Save your search' })).toBeInTheDocument()
    expect(savedSearchApi.post).toHaveBeenCalledTimes(1)
    expect(savedSearchApi.post).toHaveBeenCalledWith('/saved-searches', expect.objectContaining({
      userEmail: verifiedSession.email,
      alertSettings: expect.objectContaining({ isActive: true }),
    }), { headers: { 'X-Saved-Search-Session': verifiedSession.token } })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
