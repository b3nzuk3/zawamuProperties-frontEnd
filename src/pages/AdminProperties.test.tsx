// API responses here are explicit mocks; these tests do not contact a server.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import AdminProperties from './AdminProperties'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const legacyProperty = {
  _id: 'property-1',
  title: 'Westlands rental',
  description: 'An older listing with persisted location metadata.',
  price: 120000,
  location: 'Westlands, Nairobi',
  county: 'Nairobi',
  constituency: 'Westlands',
  ward: 'Kitisuru',
  coordinates: [36.8, -1.2] as [number, number],
  type: 'Apartment',
  listingPurpose: 'rent',
  availability: 'available',
  offerPercent: 10,
  effectivePrice: 108000,
  images: ['https://example.test/legacy-home.jpg'],
  features: ['Pool', 'Legacy fireplace'],
  bedrooms: 2,
  bathrooms: 1,
  area: 110,
  featured: true,
  __v: 7,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}
const featureCatalog = [{ _id: 'feature-pool', name: 'Pool' }]
const writableFields = new Set([
  'title', 'description', 'price', 'location', 'county', 'constituency', 'ward',
  'coordinates', 'type', 'listingPurpose', 'availability', 'offerPercent',
  'featured', 'images', 'features', 'bedrooms', 'bathrooms', 'area',
])

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockImplementation((url) => {
    if (url === '/properties') return Promise.resolve({ data: [legacyProperty] }) as never
    if (url === '/features') return Promise.resolve({ data: featureCatalog }) as never
    return Promise.resolve({ data: [] }) as never
  })
  vi.mocked(api.post).mockResolvedValue({ data: {} } as never)
  vi.mocked(api.put).mockResolvedValue({ data: legacyProperty } as never)
})

describe('AdminProperties owner editing', () => {
  it('shows purpose, availability, and base/effective monthly prices in the table', async () => {
    render(<AdminProperties />)

    expect(await screen.findByText('For rent')).toBeInTheDocument()
    expect(screen.getByText('available')).toBeInTheDocument()
    expect(screen.getByText('Base: KSh 120,000 / month')).toBeInTheDocument()
    expect(screen.getByText('Effective: KSh 108,000 / month')).toBeInTheDocument()
  })

  it('preserves legacy features, images, structured location, and sends only writable fields', async () => {
    const user = userEvent.setup()
    render(<AdminProperties />)
    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    expect(screen.getByLabelText(/title/i)).toHaveValue('Westlands rental')
    expect(within(screen.getByRole('list', { name: /selected features/i })).getByText('Legacy fireplace')).toBeInTheDocument()
    expect(screen.getByAltText('Property 1')).toHaveAttribute(
      'src',
      'https://example.test/legacy-home.jpg',
    )

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1))
    const [path, payload] = vi.mocked(api.put).mock.calls[0]
    expect(path).toBe('/properties/property-1')
    expect(payload).toMatchObject({
      features: ['Pool', 'Legacy fireplace'],
      images: ['https://example.test/legacy-home.jpg'],
      county: 'Nairobi',
      constituency: 'Westlands',
      ward: 'Kitisuru',
      coordinates: [36.8, -1.2],
    })
    expect(Object.keys(payload as object).every((field) => writableFields.has(field))).toBe(true)
    expect(payload).not.toHaveProperty('_id')
    expect(payload).not.toHaveProperty('effectivePrice')
    expect(payload).not.toHaveProperty('__v')
    expect(payload).not.toHaveProperty('createdAt')
    expect(payload).not.toHaveProperty('updatedAt')
  })

  it('uses the authoritative saved API response instead of synthesizing a local row', async () => {
    const user = userEvent.setup()
    const savedProperty = {
      ...legacyProperty,
      title: 'Server-canonical title',
      price: 135000,
      effectivePrice: 121500,
      updatedAt: '2026-11-19T12:00:00.000Z',
      __v: 8,
    }
    vi.mocked(api.put).mockResolvedValueOnce({ data: savedProperty } as never)
    render(<AdminProperties />)
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Server-canonical title')).toBeInTheDocument()
    expect(screen.getByText('Base: KSh 135,000 / month')).toBeInTheDocument()
    expect(screen.queryByText('Westlands rental')).not.toBeInTheDocument()
  })

  it('keeps edits and image/feature snapshots after a 409 conflict', async () => {
    const user = userEvent.setup()
    vi.mocked(api.put).mockRejectedValueOnce({
      response: { status: 409, data: { message: 'Property changed; reload before updating' } },
    } as never)
    render(<AdminProperties />)
    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    const title = screen.getByLabelText(/title/i)
    await user.clear(title)
    await user.type(title, 'Unsaved title must remain')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText(/property changed on the server/i)).toBeInTheDocument()
    expect(title).toHaveValue('Unsaved title must remain')
    expect(within(screen.getByRole('list', { name: /selected features/i })).getByText('Legacy fireplace')).toBeInTheDocument()
    expect(screen.getByAltText('Property 1')).toHaveAttribute(
      'src',
      'https://example.test/legacy-home.jpg',
    )
    expect(within(screen.getByRole('list', { name: /selected features/i })).getByText('Legacy fireplace')).toBeInTheDocument()
  })

  it('blocks conflicted retries across reopen until a fresh server reload succeeds', async () => {
    const user = userEvent.setup()
    const latest = { ...legacyProperty, title: 'Latest server title', price: 155000 }
    vi.mocked(api.put).mockRejectedValueOnce({ response: { status: 409 } } as never)
    render(<AdminProperties />)
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    expect(await screen.findByText(/property changed on the server/i)).toBeInTheDocument()
    const save = screen.getByRole('button', { name: 'Save Changes' })
    expect(save).toBeDisabled()
    await user.click(save)
    expect(api.put).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: /close edit property form/i }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Distinct unsaved title before failed reload')
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Offline'))
    await user.click(screen.getByRole('button', { name: /reload latest.*discard/i }))
    expect(await screen.findByText(/failed to reload property/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('Distinct unsaved title before failed reload')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    vi.mocked(api.get).mockResolvedValueOnce({ data: latest } as never)
    await user.click(screen.getByRole('button', { name: /reload latest.*discard/i }))
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue(latest.title))
    expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === '/properties/property-1')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled()
  })

  it('blocks edit submission and close while feature creation is pending', async () => {
    const user = userEvent.setup()
    let finishFeatureCreate!: (response: { data: { _id: string; name: string } }) => void
    vi.mocked(api.post).mockImplementation((url) => {
      if (url === '/features') {
        return new Promise((resolve) => { finishFeatureCreate = resolve }) as never
      }
      return Promise.resolve({ data: {} }) as never
    })
    render(<AdminProperties />)
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    const title = screen.getByLabelText(/title/i)
    await user.clear(title)
    await user.type(title, 'Keep while creating feature')
    const search = await screen.findByRole('searchbox', { name: /search or add a feature/i })
    await user.type(search, 'Garden sauna')
    await user.click(screen.getByRole('button', { name: /add feature: garden sauna/i }))

    const save = screen.getByRole('button', { name: 'Save Changes' })
    const close = screen.getByRole('button', { name: /close edit property form/i })
    expect(save).toBeDisabled()
    expect(close).toBeDisabled()
    await user.click(close)
    expect(screen.getByRole('heading', { name: 'Edit Property' })).toBeInTheDocument()
    expect(api.put).not.toHaveBeenCalled()

    finishFeatureCreate({ data: { _id: 'feature-garden-sauna', name: 'Garden sauna' } })
    expect(await within(screen.getByRole('list', { name: /selected features/i })).findByText('Garden sauna')).toBeInTheDocument()
    expect(title).toHaveValue('Keep while creating feature')
    expect(screen.getByRole('heading', { name: 'Edit Property' })).toBeInTheDocument()
    expect(save).toBeEnabled()
    expect(close).toBeEnabled()
  })

  it('locks existing and new image controls throughout upload and save', async () => {
    const user = userEvent.setup()
    let finishUpload!: (value: { data: { urls: string[] } }) => void
    let failSave!: (error: Error) => void
    vi.mocked(api.post).mockReturnValueOnce(new Promise((resolve) => { finishUpload = resolve }) as never)
    vi.mocked(api.put).mockReturnValueOnce(new Promise((_, reject) => { failSave = reject }) as never)
    render(<AdminProperties />)
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    const input = screen.getByLabelText('Images')
    await user.upload(input, new File(['fixture'], 'new-locked.jpg', { type: 'image/jpeg' }))
    const preview = await screen.findByAltText('Preview')
    const existing = screen.getByAltText('Property 1')
    const removeNew = preview.parentElement!.querySelector('button')!
    const removeExisting = existing.parentElement!.querySelector('button')!
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    expect(input).toBeDisabled()
    expect(removeNew).toBeDisabled()
    expect(removeExisting).toBeDisabled()
    await user.click(removeNew)
    await user.click(removeExisting)
    expect(preview).toBeInTheDocument()
    expect(existing).toBeInTheDocument()
    finishUpload({ data: { urls: ['new-uploaded-fixture.jpg'] } })
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/properties/property-1', expect.objectContaining({ images: [...legacyProperty.images, 'new-uploaded-fixture.jpg'] })))
    expect(input).toBeDisabled()
    expect(removeNew).toBeDisabled()
    expect(removeExisting).toBeDisabled()
    failSave(new Error('Fixture save failure'))
    await screen.findByText('Failed to update property')
    expect(input).toBeEnabled()
    expect(removeNew).toBeEnabled()
    expect(removeExisting).toBeEnabled()
  })
})
