// The API response below is an explicit fixture; no server or message provider is contacted.
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import PropertyDetails from './PropertyDetails'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
vi.mock('@/components/layout/Layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('@/components/ui/schedule-viewing-modal', () => ({
  ScheduleViewingModal: ({ children }: { children: React.ReactNode }) => <div data-testid="schedule-viewing-modal">{children}</div>,
}))
vi.mock('@/hooks/useCurrencyConverter', () => ({
  useCurrencyConverter: () => ({
    kesToUsd: (amount: number) => amount / 150,
    usdToKes: (amount: number) => amount * 150,
    formatKes: (amount: number) => `KSh ${Math.round(amount).toLocaleString('en-US')}`,
    formatUsd: (amount: number) => `$${Math.round(amount).toLocaleString('en-US')}`,
    loading: false,
    error: '',
    refreshRates: vi.fn(),
  }),
}))

const property = {
  _id: 'listing-123',
  title: 'Kilimani apartment',
  description: 'A bright place to live.',
  price: 100_000,
  location: '  Owner location, Nairobi  ',
  ward: 'Kilimani',
  county: 'Nairobi',
  type: 'Apartment',
  listingPurpose: 'rent' as const,
  availability: 'available' as const,
  bedrooms: 2,
  bathrooms: 1,
  area: 950,
  featured: true,
  offerPercent: 10,
  effectivePrice: 90_000,
}

function renderDetails() {
  return render(
    <MemoryRouter initialEntries={[`/listings/${property._id}`]}>
      <Routes>
        <Route path="/listings/:id" element={<PropertyDetails />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PropertyDetails public presentation', () => {
  it('uses manual location, shared price/badges, and keeps viewing available', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: property } as never)
    renderDetails()

    expect(await screen.findByRole('heading', { name: property.title })).toBeInTheDocument()
    expect(screen.getByText('Owner location, Nairobi')).toBeInTheDocument()
    expect(screen.getByText('For Rent')).toBeInTheDocument()
    expect(screen.getByText('Featured')).toBeInTheDocument()
    expect(screen.getByText('10% off')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('/ month')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /schedule a viewing/i })).toBeInTheDocument()
    expect(screen.getByTestId('schedule-viewing-modal')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact us/i })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: /contact about kilimani apartment on whatsapp/i })).toBeInTheDocument()
  })

  it.each(['sold', 'rented'] as const)('keeps %s listings visible but disables viewing and retains Contact and WhatsApp', async (availability) => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...property, availability } } as never)
    renderDetails()

    expect(await screen.findByRole('heading', { name: property.title })).toBeInTheDocument()
    expect(screen.getByText(availability === 'sold' ? 'Sold' : 'Rented')).toBeInTheDocument()
    expect(screen.queryByTestId('schedule-viewing-modal')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /viewing unavailable/i })).toBeDisabled()
    expect(screen.getByRole('link', { name: /contact us/i })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: /contact about kilimani apartment on whatsapp/i })).toBeInTheDocument()
  })

  it('falls back to structured location and hides bedroom/bathroom facts for Land', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: {
      ...property,
      location: ' ',
      ward: 'Kikuyu',
      constituency: 'Kikuyu',
      county: 'Kiambu',
      type: 'Land',
    } } as never)
    renderDetails()

    expect(await screen.findByText('Kikuyu, Kikuyu, Kiambu')).toBeInTheDocument()
    expect(screen.queryByText(/\bBed\b/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\bBath\b/)).not.toBeInTheDocument()
    expect(screen.getByText(/950 sqft/i)).toBeInTheDocument()
  })
})
