// Saved-search and property API responses are explicit fixtures; no real API is contacted.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import { SavedSearchesManager } from './saved-searches-manager'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('@/hooks/useCurrencyConverter', () => ({
  useCurrencyConverter: () => ({
    usdToKes: (amount: number) => amount * 100,
    kesToUsd: (amount: number) => amount / 100,
    loading: false,
    error: '',
    refreshRates: vi.fn(),
  }),
}))

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
  userEmail: 'visitor@example.test',
  userName: 'Visitor',
  searchCriteria: criteria,
  alertSettings: { isActive: true, frequency: 'daily', maxAlertsPerDay: 5 },
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

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'open').mockImplementation(() => null)
  vi.mocked(api.get).mockImplementation(async (path) => {
    if (path === '/saved-searches/user/visitor@example.test') {
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
})

describe('SavedSearchesManager', () => {
  it('summarizes all criteria and replays the unchanged criteria in View Results', async () => {
    render(<SavedSearchesManager userEmail="visitor@example.test" />)

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

    fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'View Results' }))
    await waitFor(() => expect(window.open).toHaveBeenCalledTimes(1))
    const openedUrl = String(vi.mocked(window.open).mock.calls[0][0])
    const replayed = JSON.parse(new URL(openedUrl, window.location.origin).searchParams.get('search') || 'null')
    expect(replayed).toEqual(criteria)
  })

  it('shows malformed stored criteria and disables replay/matching actions instead of broadening', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: [{ ...savedSearch, searchCriteria: { county: 'Nairobi', unknown: true } }] },
    } as never)
    render(<SavedSearchesManager userEmail="visitor@example.test" />)

    const card = await screen.findByText('Kileleshwa rentals').then((heading) => heading.closest('[data-testid="saved-search-card"]'))
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByRole('alert')).toHaveTextContent(/Unsupported saved search field/i)
    expect(within(card as HTMLElement).getByRole('button', { name: 'View Results' })).toBeDisabled()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Show matching properties' })).toBeDisabled()
    expect(window.open).not.toHaveBeenCalled()
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('does not invent a price when the server explicitly projects null despite calculable base inputs', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [savedSearch] } } as never)
      .mockResolvedValueOnce({ data: { success: true, data: { properties: [{ ...matchingProperty, effectivePrice: null }] } } } as never)
    render(<SavedSearchesManager userEmail="visitor@example.test" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Show matching properties' }))
    const card = await screen.findByTestId('matched-property-card')
    expect(within(card).getByText('Price unavailable')).toBeInTheDocument()
    expect(within(card).queryByLabelText('Original price')).not.toBeInTheDocument()
    expect(card).not.toHaveTextContent('KSh')
  })

  it('shows matched listings with shared badges, effective monthly prices and safe missing-field display', async () => {
    render(<SavedSearchesManager userEmail="visitor@example.test" />)

    const card = await screen.findByText('Kileleshwa rentals').then((heading) => heading.closest('[data-testid="saved-search-card"]'))
    expect(card).not.toBeNull()
    fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Show matching properties' }))

    await within(card as HTMLElement).findByText('Garden apartment')
    const matchCards = within(card as HTMLElement).getAllByTestId('matched-property-card')
    const matchCard = matchCards[0]
    expect(within(matchCard).getByText('Garden apartment')).toBeInTheDocument()
    expect(within(matchCard).getByText('Kileleshwa')).toBeInTheDocument()
    expect(within(matchCard).getByText('For Rent')).toBeInTheDocument()
    expect(within(matchCard).getByText('Featured')).toBeInTheDocument()
    expect(within(matchCard).getByText('Rented')).toBeInTheDocument()
    expect(within(matchCard).getByText(/KSh 91,234\.56/)).toBeInTheDocument()
    expect(within(matchCard).getByLabelText('Original price')).toHaveTextContent('KSh 100,000.11')
    expect(within(matchCard).getByText('/ month')).toBeInTheDocument()
    expect(within(matchCard).queryByText(/0\s*(bed|bath|sqft)/i)).not.toBeInTheDocument()
    expect(within(matchCard).queryByText(/Nairobi/)).not.toBeInTheDocument()
    const missingFieldsCard = matchCards[1]
    expect(within(missingFieldsCard).getByText('Location unavailable')).toBeInTheDocument()
    expect(within(missingFieldsCard).getByText('Price unavailable')).toBeInTheDocument()
    expect(within(missingFieldsCard).queryByText(/0\s*(bed|bath|sqft)/i)).not.toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/saved-searches/search-1/properties')
  })
})
