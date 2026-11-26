// The API response below is an explicit fixture; no server or message provider is contacted.
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import PropertyDetails from './PropertyDetails'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
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

function RouteControls() {
  const navigate = useNavigate()
  return (
    <div>
      <button type="button" onClick={() => navigate(`/listings/${property._id}`)}>Navigate to first listing</button>
      <button type="button" onClick={() => navigate('/listings/listing-456')}>Navigate to second listing</button>
    </div>
  )
}

function renderSwitchableDetails() {
  return render(
    <MemoryRouter initialEntries={[`/listings/${property._id}`]}>
      <RouteControls />
      <Routes>
        <Route path="/listings/:id" element={<PropertyDetails />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => vi.unstubAllEnvs())

describe('PropertyDetails public presentation', () => {
  it('uses large for the detail image, card on narrow screens, and thumbnails for the gallery', async () => {
    const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    const secondUuid = 'a47ac10b-58cc-4372-a567-0e02b2c3d470'
    vi.stubEnv('VITE_MEDIA_PUBLIC_URL', 'https://media.zawamu.test/assets')
    vi.mocked(api.get).mockResolvedValue({ data: {
      ...property,
      images: [
        `https://media.zawamu.test/assets/images/v1/${uuid}/large.webp`,
        `https://media.zawamu.test/assets/images/v1/${secondUuid}/large.webp`,
      ],
    } } as never)
    renderDetails()

    const mainImage = await screen.findByRole('img', { name: property.title })
    expect(mainImage).toHaveAttribute('src', `https://media.zawamu.test/assets/images/v1/${uuid}/large.webp`)
    const picture = mainImage.closest('picture')
    expect(picture?.querySelector('source')).toHaveAttribute(
      'srcset',
      `https://media.zawamu.test/assets/images/v1/${uuid}/card.webp`,
    )
    expect(picture?.querySelector('source')).toHaveAttribute('media', '(max-width: 767px)')
    expect(picture?.querySelector('source')?.getAttribute('srcset')).not.toMatch(/\s+\d+w$/)
    expect(screen.getByRole('img', { name: `${property.title} 2` })).toHaveAttribute(
      'src',
      `https://media.zawamu.test/assets/images/v1/${secondUuid}/thumbnail.webp`,
    )
  })

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

  it.each(['sold', 'rented'] as const)('allows a property enquiry for a %s listing', async (availability) => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValue({ data: { ...property, availability } } as never)
    vi.mocked(api.post).mockResolvedValue({ data: { received: true, message: 'Your enquiry has been received.' } } as never)
    renderDetails()

    const form = await screen.findByRole('form', { name: 'property enquiry' })
    expect(within(form).getByTestId('enquiry-property-context')).toHaveTextContent(property.title)
    await user.type(within(form).getByLabelText(/full name/i), 'Amina Njeri')
    await user.type(within(form).getByLabelText(/email address/i), 'amina@example.test')
    await user.type(within(form).getByLabelText(/subject/i), 'Availability details')
    await user.type(within(form).getByLabelText(/message/i), 'Please tell me more.')
    await user.click(within(form).getByRole('button', { name: /send enquiry/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/contact', expect.objectContaining({
      name: 'Amina Njeri',
      source: 'property',
      propertyId: property._id,
      subject: 'Availability details',
    })))
  })

  it('ignores a deferred stale property response after the route changes and submits the current property ID', async () => {
    const user = userEvent.setup()
    const second = { ...property, _id: 'listing-456', title: 'Westlands townhouse' }
    const requests = new Map<string, { resolve: (response: { data: typeof property }) => void; reject: (error: unknown) => void }>()
    vi.mocked(api.get).mockImplementation((url) => new Promise<{ data: typeof property }>((resolve, reject) => {
      requests.set(url, { resolve, reject })
    }) as never)
    vi.mocked(api.post).mockResolvedValue({ data: { received: true, message: 'Your enquiry has been received.' } } as never)
    renderSwitchableDetails()

    await waitFor(() => expect(requests.has('/properties/listing-123')).toBe(true))
    await user.click(screen.getByRole('button', { name: 'Navigate to second listing' }))
    await waitFor(() => expect(requests.has('/properties/listing-456')).toBe(true))
    requests.get('/properties/listing-456')?.resolve({ data: second })
    expect(await screen.findByRole('heading', { name: second.title })).toBeInTheDocument()
    requests.get('/properties/listing-123')?.resolve({ data: property })

    await waitFor(() => expect(screen.getByRole('heading', { name: second.title })).toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: property.title })).not.toBeInTheDocument()
    const form = within(screen.getByRole('form', { name: 'property enquiry' }))
    await user.type(form.getByLabelText(/full name/i), 'Amina Njeri')
    await user.type(form.getByLabelText(/email address/i), 'amina@example.test')
    await user.type(form.getByLabelText(/subject/i), 'Availability details')
    await user.type(form.getByLabelText(/message/i), 'Please tell me more.')
    await user.click(form.getByRole('button', { name: /send enquiry/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/contact', expect.objectContaining({
      source: 'property',
      propertyId: second._id,
    })))
  })

  it('ignores a stale property request failure after a newer route has loaded', async () => {
    const user = userEvent.setup()
    const second = { ...property, _id: 'listing-456', title: 'Westlands townhouse' }
    const requests = new Map<string, { resolve: (response: { data: typeof property }) => void; reject: (error: unknown) => void }>()
    vi.mocked(api.get).mockImplementation((url) => new Promise<{ data: typeof property }>((resolve, reject) => {
      requests.set(url, { resolve, reject })
    }) as never)
    renderSwitchableDetails()

    await waitFor(() => expect(requests.has('/properties/listing-123')).toBe(true))
    await user.click(screen.getByRole('button', { name: 'Navigate to second listing' }))
    await waitFor(() => expect(requests.has('/properties/listing-456')).toBe(true))
    requests.get('/properties/listing-456')?.resolve({ data: second })
    expect(await screen.findByRole('heading', { name: second.title })).toBeInTheDocument()
    requests.get('/properties/listing-123')?.reject(new Error('stale request failed'))

    await waitFor(() => expect(screen.getByRole('heading', { name: second.title })).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'property enquiry' })).toBeInTheDocument()
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
