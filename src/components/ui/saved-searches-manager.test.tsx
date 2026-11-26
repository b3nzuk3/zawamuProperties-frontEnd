// The saved-search transport below is mocked; these are UI/API-contract fixtures, not a live server.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SavedSearchesManager } from './saved-searches-manager'
import { savedSearchApi } from '@/lib/savedSearchApi'

vi.mock('@/lib/savedSearchApi', () => ({
  savedSearchApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  isSavedSearchUnauthorized: (error: unknown) => (
    typeof error === 'object' && error !== null && 'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  ),
  savedSearchSessionConfig: (token: string) => ({ headers: { 'X-Saved-Search-Session': token } }),
}))

vi.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }))
vi.mock('@/hooks/useCurrencyConverter', () => ({
  useCurrencyConverter: () => ({
    usdToKes: (amount: number) => amount * 100,
    kesToUsd: (amount: number) => amount / 100,
    loading: false,
    error: '',
    refreshRates: vi.fn(),
  }),
}))

const session = {
  token: 'guest-management-proof',
  email: 'visitor@example.test',
  expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
}

const criteria = {
  location: 'Kileleshwa',
  listingPurpose: 'rent' as const,
  propertyTypes: ['Apartment'],
  minPrice: 0,
  maxPrice: 100_000.25,
  minBedrooms: 2,
  minBathrooms: 1,
  searchTerm: 'garden',
}

const savedSearch = {
  _id: 'search-1',
  name: 'Kileleshwa rentals',
  description: 'Monthly homes',
  searchCriteria: criteria,
  alertSettings: { isActive: false, frequency: 'daily', maxAlertsPerDay: 5 },
  verifiedAt: null,
  alertConsentAt: null,
  totalAlertsSent: 2,
  createdAt: '2026-11-01T00:00:00.000Z',
}

const matchingProperty = {
  _id: 'property-1',
  title: 'Garden apartment',
  description: 'Bright rental',
  price: 100_000.11,
  effectivePrice: 91_234.56,
  offerPercent: 10,
  location: 'Kileleshwa',
  county: 'Nairobi',
  type: 'Apartment',
  listingPurpose: 'rent' as const,
  availability: 'rented' as const,
  featured: true,
  images: [],
}

const missingFieldsProperty = {
  _id: 'property-legacy',
  title: 'Legacy listing with missing data',
  description: '',
  location: '',
  type: 'Apartment',
  listingPurpose: 'rent' as const,
}

const onSessionInvalid = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'open').mockImplementation(() => null)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.mocked(savedSearchApi.get).mockImplementation(async (path) => {
    if (path === '/saved-searches?page=1&limit=20') {
      return { data: { success: true, data: [savedSearch] } } as never
    }
    if (path === '/saved-searches/search-1/properties') {
      return {
        data: {
          success: true,
          data: {
            properties: [matchingProperty, missingFieldsProperty],
            pagination: { currentPage: 1, totalPages: 1, totalProperties: 2 },
          },
        },
      } as never
    }
    throw new Error(`Unexpected fixture request: ${path}`)
  })
  vi.mocked(savedSearchApi.put).mockResolvedValue({ status: 200, data: { success: true } } as never)
})

afterEach(() => vi.unstubAllEnvs())

describe('SavedSearchesManager', () => {
  it('loads only through the verified session and replays unchanged criteria', async () => {
    render(<SavedSearchesManager session={session} onSessionInvalid={onSessionInvalid} />)

    const card = await screen.findByText('Kileleshwa rentals').then((heading) => heading.closest('[data-testid="saved-search-card"]'))
    expect(card).not.toBeNull()
    expect(card).toHaveTextContent('Location: Kileleshwa')
    expect(card).toHaveTextContent('For Rent')
    expect(card).toHaveTextContent('Apartment')
    expect(card).toHaveTextContent('KSh 0')
    expect(card).toHaveTextContent('KSh 100,000.25 / month')
    expect(card).toHaveTextContent('Bedrooms: 2 - Any')
    expect(card).toHaveTextContent('Bathrooms: 1 - Any')
    expect(card).toHaveTextContent('Search: "garden"')
    expect(within(card as HTMLElement).getByText('Alerts are off until you explicitly enable them for this search.')).toBeInTheDocument()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Enable email alerts' })).toBeEnabled()

    fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'View Results' }))
    await waitFor(() => expect(window.open).toHaveBeenCalledTimes(1))
    const openedUrl = String(vi.mocked(window.open).mock.calls[0][0])
    const replayed = JSON.parse(new URL(openedUrl, window.location.origin).searchParams.get('search') || 'null')
    expect(replayed).toEqual(criteria)
    expect(savedSearchApi.get).toHaveBeenCalledWith('/saved-searches?page=1&limit=20', {
      headers: { 'X-Saved-Search-Session': session.token },
    })
  })

  it('fails closed for null legacy criteria without exposing an unfiltered result or edit action', async () => {
    vi.mocked(savedSearchApi.get).mockResolvedValueOnce({
      data: { success: true, data: [{ ...savedSearch, searchCriteria: null }] },
    } as never)
    render(<SavedSearchesManager session={session} onSessionInvalid={onSessionInvalid} />)

    const card = await screen.findByText('Kileleshwa rentals').then((heading) => heading.closest('[data-testid="saved-search-card"]'))
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByRole('alert')).toHaveTextContent(/must be an object/i)
    expect(within(card as HTMLElement).getByRole('button', { name: 'View Results' })).toBeDisabled()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Show matching properties' })).toBeDisabled()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Alerts unavailable' })).toBeDisabled()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Delete' })).toBeEnabled()
    expect(within(card as HTMLElement).queryByText('All properties')).not.toBeInTheDocument()
    expect(window.open).not.toHaveBeenCalled()
  })

  it('shows first ten matching properties and a clear page-size note', async () => {
    const properties = Array.from({ length: 11 }, (_, index) => ({
      ...matchingProperty,
      _id: `property-${index + 1}`,
      title: `Garden apartment ${index + 1}`,
      images: index === 0
        ? ['https://media.zawamu.test/assets/images/v1/f47ac10b-58cc-4372-a567-0e02b2c3d479/large.webp']
        : [],
    }))
    vi.stubEnv('VITE_MEDIA_PUBLIC_URL', 'https://media.zawamu.test/assets')
    vi.mocked(savedSearchApi.get).mockImplementation(async (path) => {
      if (path === '/saved-searches?page=1&limit=20') return { data: { success: true, data: [savedSearch] } } as never
      if (path === '/saved-searches/search-1/properties') {
        return { data: { success: true, data: { properties, pagination: { totalProperties: 11 } } } } as never
      }
      throw new Error(`Unexpected fixture request: ${path}`)
    })
    render(<SavedSearchesManager session={session} onSessionInvalid={onSessionInvalid} />)
    const card = await screen.findByText('Kileleshwa rentals').then((heading) => heading.closest('[data-testid="saved-search-card"]')) as HTMLElement
    fireEvent.click(within(card).getByRole('button', { name: 'Show matching properties' }))

    await within(card).findByText('Garden apartment 10')
    expect(within(card).getAllByTestId('matched-property-card')).toHaveLength(10)
    expect(within(card).getByRole('img', { name: 'Garden apartment 1' })).toHaveAttribute(
      'src',
      'https://media.zawamu.test/assets/images/v1/f47ac10b-58cc-4372-a567-0e02b2c3d479/card.webp',
    )
    expect(within(card).queryByText('Garden apartment 11')).not.toBeInTheDocument()
    expect(within(card).getByText('Showing the first 10 of 11 matching properties.')).toBeInTheDocument()
    expect(savedSearchApi.get).toHaveBeenCalledWith('/saved-searches/search-1/properties', {
      headers: { 'X-Saved-Search-Session': session.token },
    })
  })

  it('enables alerts only after a per-search confirmation action and sends proof on that route', async () => {
    const verifiedSearch = {
      ...savedSearch,
      alertSettings: { ...savedSearch.alertSettings, isActive: true },
      verifiedAt: '2026-11-23T08:00:00.000Z',
      alertConsentAt: '2026-11-23T08:01:00.000Z',
    }
    let listRequestCount = 0
    vi.mocked(savedSearchApi.get).mockImplementation(async (path) => {
      if (path === '/saved-searches?page=1&limit=20') {
        listRequestCount += 1
        return { data: { success: true, data: [listRequestCount > 1 ? verifiedSearch : savedSearch] } } as never
      }
      throw new Error(`Unexpected fixture request: ${path}`)
    })
    render(<SavedSearchesManager session={session} onSessionInvalid={onSessionInvalid} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Enable email alerts' }))
    await waitFor(() => expect(savedSearchApi.put).toHaveBeenCalledWith('/saved-searches/search-1', {
      alertSettings: { isActive: true, frequency: 'daily', maxAlertsPerDay: 5 },
    }, { headers: { 'X-Saved-Search-Session': session.token } }))
    expect(await screen.findByText(/alert consent recorded/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Turn alerts off' })).toBeInTheDocument()
  })

  it('retains editable cadence and quota without silently opting an inactive search in', async () => {
    render(<SavedSearchesManager session={session} onSessionInvalid={onSessionInvalid} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Alert frequency'), { target: { value: 'weekly' } })
    fireEvent.change(screen.getByLabelText('Maximum alerts per day'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update search' }))
    await waitFor(() => expect(savedSearchApi.put).toHaveBeenCalledWith('/saved-searches/search-1', {
      name: savedSearch.name,
      description: savedSearch.description || '',
      alertSettings: { frequency: 'weekly', maxAlertsPerDay: 2 },
    }, { headers: { 'X-Saved-Search-Session': session.token } }))
    expect(screen.queryByText('Total alerts:')).not.toBeInTheDocument()
  })

  it('clears management UI through its parent when a session request is unauthorized', async () => {
    vi.mocked(savedSearchApi.get).mockRejectedValueOnce({ response: { status: 401 } })
    render(<SavedSearchesManager session={session} onSessionInvalid={onSessionInvalid} />)
    await waitFor(() => expect(onSessionInvalid).toHaveBeenCalledWith(session.token))
    expect(screen.queryByText('Kileleshwa rentals')).not.toBeInTheDocument()
  })

  it('does not allow a stale list response to replace results for a newer session', async () => {
    let resolveOld: ((response: unknown) => void) | undefined
    vi.mocked(savedSearchApi.get).mockImplementation((path, config) => {
      if (!path.startsWith('/saved-searches?page=')) throw new Error(`Unexpected fixture request: ${path}`)
      const token = (config?.headers as Record<string, string>)?.['X-Saved-Search-Session']
      if (token === 'old-proof') {
        return new Promise((resolve) => { resolveOld = resolve }) as never
      }
      return Promise.resolve({ data: { success: true, data: [{ ...savedSearch, name: 'New account search' }] } }) as never
    })
    const oldSession = { ...session, token: 'old-proof' }
    const { rerender } = render(<SavedSearchesManager session={oldSession} onSessionInvalid={onSessionInvalid} />)
    rerender(<SavedSearchesManager session={{ ...session, token: 'new-proof' }} onSessionInvalid={onSessionInvalid} />)
    expect(await screen.findByText('New account search')).toBeInTheDocument()
    resolveOld?.({ data: { success: true, data: [{ ...savedSearch, name: 'Old account search' }] } })
    await waitFor(() => expect(screen.queryByText('Old account search')).not.toBeInTheDocument())
  })

  it('uses server pagination and reports the visible range as page controls move', async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      ...savedSearch,
      _id: `search-${index + 1}`,
      name: `Saved search ${index + 1}`,
    }))
    const secondPage = [{ ...savedSearch, _id: 'search-21', name: 'Saved search 21' }]
    vi.mocked(savedSearchApi.get).mockImplementation(async (path) => {
      if (path === '/saved-searches?page=1&limit=20') {
        return { data: { success: true, data: firstPage, pagination: {
          currentPage: 1, totalPages: 2, totalSearches: 21, hasNextPage: true, hasPrevPage: false,
        } } } as never
      }
      if (path === '/saved-searches?page=2&limit=20') {
        return { data: { success: true, data: secondPage, pagination: {
          currentPage: 2, totalPages: 2, totalSearches: 21, hasNextPage: false, hasPrevPage: true,
        } } } as never
      }
      throw new Error(`Unexpected fixture request: ${path}`)
    })
    render(<SavedSearchesManager session={session} onSessionInvalid={onSessionInvalid} />)

    expect(await screen.findByText('Saved search 1')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–20 of 21 saved searches · Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(await screen.findByText('Saved search 21')).toBeInTheDocument()
    expect(screen.getByText('Showing 21–21 of 21 saved searches · Page 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(await screen.findByText('Saved search 1')).toBeInTheDocument()
    expect(savedSearchApi.get).toHaveBeenCalledWith('/saved-searches?page=2&limit=20', {
      headers: { 'X-Saved-Search-Session': session.token },
    })
  })

  it('returns to the previous populated page after deleting the last row on the last page', async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      ...savedSearch,
      _id: `search-${index + 1}`,
      name: `Saved search ${index + 1}`,
    }))
    const lastPage = [{ ...savedSearch, _id: 'search-21', name: 'Saved search 21' }]
    let lastPageRequestCount = 0
    let deleted = false
    vi.mocked(savedSearchApi.get).mockImplementation(async (path) => {
      if (path === '/saved-searches?page=1&limit=20') {
        return { data: { success: true, data: firstPage, pagination: {
          currentPage: 1, totalPages: deleted ? 1 : 2, totalSearches: deleted ? 20 : 21,
          hasNextPage: !deleted, hasPrevPage: false,
        } } } as never
      }
      if (path === '/saved-searches?page=2&limit=20') {
        lastPageRequestCount += 1
        if (lastPageRequestCount === 1) {
          return { data: { success: true, data: lastPage, pagination: {
            currentPage: 2, totalPages: 2, totalSearches: 21, hasNextPage: false, hasPrevPage: true,
          } } } as never
        }
        return { data: { success: true, data: [], pagination: {
          currentPage: 2, totalPages: 1, totalSearches: 20, hasNextPage: false, hasPrevPage: true,
        } } } as never
      }
      throw new Error(`Unexpected fixture request: ${path}`)
    })
    vi.mocked(savedSearchApi.delete).mockImplementation(async () => {
      deleted = true
      return { status: 204, data: undefined } as never
    })
    render(<SavedSearchesManager session={session} onSessionInvalid={onSessionInvalid} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Next page' }))
    const lastRow = await screen.findByText('Saved search 21')
    const lastRowCard = lastRow.closest('[data-testid="saved-search-card"]') as HTMLElement
    fireEvent.click(within(lastRowCard).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Saved search 20')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–20 of 20 saved searches · Page 1 of 1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument()
    expect(savedSearchApi.get).toHaveBeenNthCalledWith(3, '/saved-searches?page=2&limit=20', {
      headers: { 'X-Saved-Search-Session': session.token },
    })
    expect(savedSearchApi.get).toHaveBeenNthCalledWith(4, '/saved-searches?page=1&limit=20', {
      headers: { 'X-Saved-Search-Session': session.token },
    })
    expect(savedSearchApi.delete).toHaveBeenCalledWith('/saved-searches/search-21', {
      headers: { 'X-Saved-Search-Session': session.token },
    })
  })
})
