// API responses are explicit fixtures; these tests do not contact a server.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import FeaturedListings from './FeaturedListings'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn() },
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
  _id: 'featured-1',
  title: 'Featured Nairobi Apartment',
  description: 'A quiet, sunny home',
  price: 2_000_000,
  location: 'Kilimani',
  type: 'Apartment',
  listingPurpose: 'sale',
  availability: 'available',
  offerPercent: 0,
  effectivePrice: 2_000_000,
  images: ['/featured.jpg'],
  bedrooms: 3,
  bathrooms: 2,
  area: 120,
  featured: true,
  ...overrides,
})

const renderFeatured = () => render(
  <MemoryRouter>
    <FeaturedListings />
  </MemoryRouter>,
)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockResolvedValue({ data: [] } as never)
})

afterEach(() => vi.unstubAllEnvs())

describe('featured public listings', () => {
  it('uses the card WebP for owned featured images', async () => {
    const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    vi.stubEnv('VITE_MEDIA_PUBLIC_URL', 'https://media.zawamu.test/assets')
    vi.mocked(api.get).mockResolvedValue({
      data: [property({ images: [`https://media.zawamu.test/assets/images/v1/${uuid}/large.webp`] })],
    } as never)
    renderFeatured()

    expect(await screen.findByRole('img', { name: 'Featured Nairobi Apartment' })).toHaveAttribute(
      'src',
      `https://media.zawamu.test/assets/images/v1/${uuid}/card.webp`,
    )
  })

  it('keeps only featured listings and integrates prices, availability badges, and contact actions', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        property({
          _id: 'featured-rent',
          title: 'Featured rental',
          listingPurpose: 'rent',
          price: 120_000,
          offerPercent: 10,
          effectivePrice: 108_000,
        }),
        property({
          _id: 'featured-sold-land',
          title: 'Featured sold land',
          type: 'Land',
          availability: 'sold',
          bedrooms: 0,
          bathrooms: 0,
        }),
        property({ _id: 'not-featured', title: 'Not featured', featured: false }),
      ],
    } as never)
    renderFeatured()

    expect(await screen.findByText('Featured rental')).toBeInTheDocument()
    expect(screen.getByText('Featured sold land')).toBeInTheDocument()
    expect(screen.queryByText('Not featured')).not.toBeInTheDocument()
    expect(screen.getByText('Sold')).toBeInTheDocument()
    expect(screen.getByText(/108,000/)).toBeInTheDocument()
    expect(screen.getByText((_, node) => node?.textContent === '/ month')).toBeInTheDocument()
    expect(screen.queryByText('0 Bed')).not.toBeInTheDocument()
    expect(screen.queryByText('0 Bath')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('schedule-viewing-modal')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /viewing unavailable/i })).toBeDisabled()
    expect(screen.getAllByRole('link', { name: /whatsapp/i })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: /view details/i }).find((link) => link.getAttribute('href') === '/listings/featured-rent')).toBeInTheDocument()
  })

  it('shows rented state and retains legacy id/image fallbacks', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [property({
        _id: undefined,
        id: 'old-featured-id',
        image: '/legacy-featured.jpg',
        images: undefined,
        title: 'Legacy rented listing',
        listingPurpose: 'rent',
        availability: 'rented',
      })],
    } as never)
    renderFeatured()

    expect(await screen.findByText('Legacy rented listing')).toBeInTheDocument()
    expect(screen.getByText('Rented')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Legacy rented listing' })).toHaveAttribute('src', '/legacy-featured.jpg')
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute('href', '/listings/old-featured-id')
    expect(screen.queryByTestId('schedule-viewing-modal')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /viewing unavailable/i })).toBeDisabled()
    expect(screen.getByRole('link', { name: /whatsapp/i })).toBeInTheDocument()
  })
})
