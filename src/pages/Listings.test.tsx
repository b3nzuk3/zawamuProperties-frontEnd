// API responses are explicit fixtures; these tests do not contact a server.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import { savedSearchApi } from '@/lib/savedSearchApi'
import Listings from './Listings'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Stub the modal so these tests prove view-availability gating, not modal form behavior.
vi.mock('@/components/ui/schedule-viewing-modal', () => ({
  ScheduleViewingModal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="schedule-viewing-modal">{children}</div>
  ),
}))

const property = (overrides: Record<string, unknown> = {}) => ({
  _id: 'listing-1',
  title: 'Nairobi Apartment',
  description: 'Bright home near shops',
  price: 1_000_000,
  location: 'Westlands',
  county: 'Nairobi',
  type: 'Apartment',
  listingPurpose: 'sale',
  availability: 'available',
  offerPercent: 0,
  effectivePrice: 1_000_000,
  images: ['/apartment.jpg'],
  bedrooms: 2,
  bathrooms: 1,
  area: 80,
  featured: false,
  ...overrides,
})

const renderListings = (initialEntry = '/listings') => render(
  <MemoryRouter initialEntries={[initialEntry]}>
    <Listings />
  </MemoryRouter>,
)

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  vi.mocked(api.get).mockResolvedValue({ data: [] } as never)
  vi.mocked(api.post).mockResolvedValue({ data: { success: true } } as never)
  vi.spyOn(savedSearchApi, 'post').mockResolvedValue({ status: 202, data: { success: true, message: 'Request accepted.' } } as never)
})

describe('public listings filters and actions', () => {
  it('filters by purpose independently of property type and treats legacy purpose as sale', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValue({
      data: [
        property({ _id: 'sale-apartment', title: 'Sale apartment' }),
        property({ _id: 'rent-apartment', title: 'Rental apartment', listingPurpose: 'rent' }),
        property({ _id: 'rent-land', title: 'Rental land', listingPurpose: 'rent', type: 'Land' }),
        property({ _id: 'legacy-sale', title: 'Legacy sale', listingPurpose: undefined, availability: undefined }),
      ],
    } as never)
    renderListings()

    expect(await screen.findByText('Sale apartment')).toBeInTheDocument()
    expect(screen.getByText('Rental apartment')).toBeInTheDocument()
    expect(screen.getByText('Rental land')).toBeInTheDocument()
    expect(screen.getByText('Legacy sale')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'For Rent' }))
    expect(screen.getByText('Rental apartment')).toBeInTheDocument()
    expect(screen.getByText('Rental land')).toBeInTheDocument()
    expect(screen.queryByText('Sale apartment')).not.toBeInTheDocument()
    expect(screen.queryByText('Legacy sale')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Filters' }))
    await user.click(screen.getByRole('checkbox', { name: 'Land' }))
    expect(screen.getByText('Rental land')).toBeInTheDocument()
    expect(screen.queryByText('Rental apartment')).not.toBeInTheDocument()
  })

  it('uses the manual location, discounted effective prices and an unbounded optional maximum', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValue({
      data: [
        property({
          _id: 'manual-location',
          title: 'Manual location wins',
          location: 'Westlands',
          county: 'Mombasa',
          listingPurpose: 'rent',
          price: 300_000,
          offerPercent: 20,
          effectivePrice: undefined,
        }),
        property({
          _id: 'high-price',
          title: 'Uncapped sale',
          location: 'Nanyuki',
          price: 25_000_000,
          effectivePrice: 25_000_000,
        }),
        property({
          _id: 'discounted-sale',
          title: 'Discounted below minimum',
          price: 1_000_000,
          offerPercent: 20,
          effectivePrice: 800_000,
        }),
      ],
    } as never)
    renderListings()

    await screen.findByText('Manual location wins')
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    await user.type(screen.getByLabelText('Location'), 'Westlands')
    expect(screen.getByText('Manual location wins')).toBeInTheDocument()
    expect(screen.queryByText('Uncapped sale')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('Location'))
    const minPrice = screen.getByLabelText('Minimum price')
    const maxPrice = screen.getByLabelText('Maximum price')
    expect(maxPrice).not.toHaveAttribute('max')

    await user.type(minPrice, '200000')
    await user.type(maxPrice, '250000')
    expect(screen.getByText('Manual location wins')).toBeInTheDocument()
    await user.clear(minPrice)
    await user.clear(maxPrice)

    await user.click(screen.getByRole('button', { name: 'For Sale' }))
    await user.type(minPrice, '20000001')
    await user.type(maxPrice, '30000000')
    expect(screen.getByText('Uncapped sale')).toBeInTheDocument()
    expect(screen.queryByText('Discounted below minimum')).not.toBeInTheDocument()
  })

  it('shows status, monthly rent labels and active contact while blocking unavailable viewings; land omits beds/baths', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValue({
      data: [
        property({ _id: 'available-rent', title: 'Available rental', listingPurpose: 'rent', offerPercent: 10, effectivePrice: 900_000 }),
        property({ _id: 'sold-land', title: 'Sold land', type: 'Land', availability: 'sold', bedrooms: 0, bathrooms: 0 }),
        property({ _id: 'rented-home', title: 'Rented home', listingPurpose: 'rent', availability: 'rented' }),
      ],
    } as never)
    renderListings()

    expect(await screen.findByText('Sold')).toBeInTheDocument()
    expect(screen.getByText('Rented')).toBeInTheDocument()
    expect(screen.getByText(/900,000/)).toBeInTheDocument()
    expect(screen.getAllByText((_, node) => node?.textContent === '/ month')).toHaveLength(2)
    expect(screen.queryByText('0 Bed')).not.toBeInTheDocument()
    expect(screen.queryByText('0 Bath')).not.toBeInTheDocument()

    const viewingModals = screen.getAllByTestId('schedule-viewing-modal')
    expect(viewingModals).toHaveLength(1)
    const unavailableButtons = screen.getAllByRole('button', { name: /viewing unavailable/i })
    expect(unavailableButtons).toHaveLength(2)
    unavailableButtons.forEach((button) => expect(button).toBeDisabled())
    expect(screen.getAllByRole('link', { name: /whatsapp/i })).toHaveLength(3)
    expect(within(viewingModals[0]).getByRole('button', { name: /schedule viewing/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'List view' }))
    expect(screen.getByText('Sold')).toBeInTheDocument()
    expect(screen.getByText('Rented')).toBeInTheDocument()
  })

  it('saves the visible location, purpose, taxonomy, effective-price and bedroom/bathroom/search criteria', async () => {
    const user = userEvent.setup()
    const initialCriteria = { minBedrooms: 2, minBathrooms: 1 }
    const criteria = {
      location: 'Westlands',
      listingPurpose: 'rent',
      propertyTypes: ['Apartment'],
      minPrice: 0,
      maxPrice: 250_000.25,
      minBedrooms: 2,
      minBathrooms: 1,
      searchTerm: 'garden',
    }
    renderListings(`/listings?search=${encodeURIComponent(JSON.stringify(initialCriteria))}`)

    await screen.findByRole('heading', { name: 'Property Listings' })
    await user.type(screen.getByPlaceholderText('Search by property name or location...'), 'garden')
    await user.click(screen.getByRole('button', { name: 'For Rent' }))
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    await user.type(screen.getByLabelText('Location'), 'Westlands')
    await user.click(screen.getByRole('checkbox', { name: 'Apartment' }))
    await user.type(screen.getByLabelText('Minimum price'), '0')
    await user.type(screen.getByLabelText('Maximum price'), '250000.25')
    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('2+')
    expect(screen.getAllByRole('combobox')[1]).toHaveTextContent('1+')
    expect(screen.getByRole('button', { name: /save search/i })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Save Search' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/KSh 0/)).toBeInTheDocument()
    expect(within(dialog).getByText(/KSh 250,000\.25/)).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Search Name *'), 'Westlands rentals')
    await user.type(within(dialog).getByLabelText('Full Name *'), 'Test Visitor')
    await user.type(within(dialog).getByLabelText('Email Address *'), 'visitor@example.test')
    await user.click(within(dialog).getByRole('button', { name: 'Save Search' }))

    await waitFor(() => expect(savedSearchApi.post).toHaveBeenCalledWith('/saved-searches', expect.objectContaining({
      searchCriteria: {
        ...criteria,
      },
    }), undefined))
    expect(await screen.findByRole('button', { name: 'Request verification email' })).toBeInTheDocument()
  })

  it('replays saved criteria, including legacy structured fields and all bedroom/bathroom/search constraints', async () => {
    const criteria = {
      location: 'Kileleshwa',
      listingPurpose: 'rent',
      propertyTypes: ['apartment'],
      minPrice: 0,
      maxPrice: 900_000.25,
      county: 'Nairobi',
      constituency: 'Westlands',
      ward: 'Parklands',
      minBedrooms: 3,
      maxBedrooms: 4,
      minBathrooms: 1,
      maxBathrooms: 2,
      searchTerm: 'garden',
    }
    vi.mocked(api.get).mockResolvedValue({
      data: [
        property({
          _id: 'match',
          title: 'Garden rental in Kileleshwa',
          location: 'Kileleshwa',
          county: 'Nairobi',
          constituency: 'Westlands',
          ward: 'Parklands',
          listingPurpose: 'rent',
          price: 1_000_000,
          offerPercent: 10,
          effectivePrice: 900_000.25,
          bedrooms: 3,
          bathrooms: 1,
        }),
        property({ _id: 'missing-structured', title: 'Garden without county metadata', county: undefined }),
        property({ _id: 'missing-bedrooms', title: 'Garden without bedroom data', bedrooms: undefined }),
        property({ _id: 'wrong-purpose', title: 'Garden sale', listingPurpose: 'sale' }),
      ],
    } as never)
    renderListings(`/listings?search=${encodeURIComponent(JSON.stringify(criteria))}`)

    expect(await screen.findByText('Garden rental in Kileleshwa')).toBeInTheDocument()
    expect(screen.queryByText('Garden without county metadata')).not.toBeInTheDocument()
    expect(screen.queryByText('Garden without bedroom data')).not.toBeInTheDocument()
    expect(screen.queryByText('Garden sale')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'For Rent' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Filters' }))
    expect(screen.getByLabelText('Location')).toHaveValue('Kileleshwa')
    expect(screen.getByLabelText('Minimum price')).toHaveValue(0)
    expect(screen.getByLabelText('Maximum price')).toHaveValue(900_000.25)
    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('3+')
    expect(screen.getAllByRole('combobox')[1]).toHaveTextContent('1+')
    expect(screen.getByText(/Structured area:.*Nairobi/i)).toBeInTheDocument()
  })

  it('fails closed on unsupported replay fields and requires an explicit clear to browse', async () => {
    const user = userEvent.setup()
    const criteria = { location: 'Nairobi', unsupportedLegacyField: 'must not be ignored' }
    vi.mocked(api.get).mockResolvedValue({ data: [property()] } as never)
    renderListings(`/listings?search=${encodeURIComponent(JSON.stringify(criteria))}`)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Unsupported saved search field/i)
    expect(screen.queryByTestId('property-card')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Search' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expect(await screen.findByText('Nairobi Apartment')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('retains hidden legacy bounds and structured criteria when saving a replayed search again', async () => {
    const criteria = {
      county: 'Nairobi',
      constituency: 'Westlands',
      ward: 'Parklands',
      propertyTypes: ['house'],
      minBedrooms: 2,
      maxBedrooms: 4,
      minBathrooms: 1,
      maxBathrooms: 2,
      searchTerm: 'garden',
    }
    const user = userEvent.setup()
    renderListings(`/listings?search=${encodeURIComponent(JSON.stringify(criteria))}`)
    await screen.findByRole('heading', { name: 'Property Listings' })
    await user.click(screen.getByRole('button', { name: 'Save Search' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Search Name *'), 'Legacy houses')
    await user.type(within(dialog).getByLabelText('Full Name *'), 'Test Visitor')
    await user.type(within(dialog).getByLabelText('Email Address *'), 'visitor@example.test')
    await user.click(within(dialog).getByRole('button', { name: 'Save Search' }))

    await waitFor(() => expect(savedSearchApi.post).toHaveBeenCalledWith('/saved-searches', expect.objectContaining({
      searchCriteria: criteria,
    }), undefined))
  })

  it('keeps legacy id and image fallbacks in the public card', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [property({ _id: undefined, id: 'legacy-id', image: '/legacy.jpg', images: undefined })],
    } as never)
    renderListings()

    expect(await screen.findByRole('img', { name: 'Nairobi Apartment' })).toHaveAttribute('src', '/legacy.jpg')
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute('href', '/listings/legacy-id')
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/properties'))
  })
})
