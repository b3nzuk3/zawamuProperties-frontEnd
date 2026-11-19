// API responses here are explicit mocks; these tests do not contact a server.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import Admin from './Admin'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('react-markdown-editor-lite', () => ({ default: () => null }))

const dashboardStats = {
  totals: { properties: 4, activeListings: 3, blogPosts: 2, inquiries: 1 },
  monthOverMonth: { properties: 0, activeListings: 0, blogPosts: 0, inquiries: 0 },
}
const features = [
  { _id: 'feature-garden', name: 'Garden' },
  { _id: 'feature-garage', name: 'Garage' },
]
const rentalTypes = ['Apartment', 'Bungalow', 'Townhouse', 'Land']

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockImplementation((url) => {
    if (url === '/admin/stats') return Promise.resolve({ data: dashboardStats }) as never
    if (url === '/admin/recent-activity') return Promise.resolve({ data: [] }) as never
    if (url === '/features') return Promise.resolve({ data: features }) as never
    return Promise.resolve({ data: [] }) as never
  })
  vi.mocked(api.post).mockResolvedValue({ data: {} } as never)
})

function renderAdmin() {
  return render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>,
  )
}

async function openPropertyForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Add Property' }))
  return screen.getByRole('heading', { name: 'Add Property' }).closest('form') as HTMLFormElement
}

async function fillRentalForm(
  user: ReturnType<typeof userEvent.setup>,
  type: string,
  title = 'Rental listing',
) {
  await user.type(screen.getByLabelText(/title/i), title)
  await user.type(screen.getByLabelText(/description/i), 'A bright, well-kept home.')
  await user.type(screen.getByLabelText(/location/i), 'Free-text location, Nairobi')
  await user.selectOptions(screen.getByLabelText(/listing purpose/i), 'rent')
  await user.selectOptions(screen.getByLabelText(/property type/i), type)
  await user.type(screen.getByLabelText(/monthly rent \(kes\)/i), '100000')
}

describe('Admin property creation form', () => {
  it.each(rentalTypes)('creates a rental listing for the supported %s type', async (type) => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByText('Admin Dashboard')
    const form = await openPropertyForm(user)
    await fillRentalForm(user, type)
    if (type === 'Apartment') {
      const featureList = await screen.findByRole('listbox', { name: /available features/i })
      await user.click(within(featureList).getByRole('option', { name: 'Garden' }))
    }

    await user.click(within(form).getByRole('button', { name: 'Add Property' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/properties', expect.objectContaining({
        title: 'Rental listing',
        description: 'A bright, well-kept home.',
        listingPurpose: 'rent',
        availability: 'available',
        type,
        price: 100000,
        location: 'Free-text location, Nairobi',
        features: type === 'Apartment' ? ['Garden'] : [],
      }))
    })
    expect(await screen.findByRole('status')).toHaveTextContent(/property added successfully/i)
    expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === '/admin/stats')).toHaveLength(2)
  })

  it('previews discounted rent and validates before attempting image upload', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByText('Admin Dashboard')
    const form = await openPropertyForm(user)

    await user.type(screen.getByLabelText(/title/i), 'Discounted rental')
    await user.type(screen.getByLabelText(/description/i), 'A home with an early-bird offer.')
    await user.type(screen.getByLabelText(/location/i), 'Westlands, Nairobi')
    await user.selectOptions(screen.getByLabelText(/availability/i), 'sold')
    await user.selectOptions(screen.getByLabelText(/listing purpose/i), 'rent')
    await user.selectOptions(screen.getByLabelText(/property type/i), 'Apartment')
    await user.type(screen.getByLabelText(/monthly rent \(kes\)/i), '100000')
    const offer = screen.getByLabelText(/offer/i)
    await user.clear(offer)
    await user.type(offer, '10')
    expect(screen.getByText(/effective price preview/i)).toBeInTheDocument()
    expect(screen.getByText(/90,000/)).toBeInTheDocument()

    const image = new File(['image data'], 'rental.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText(/images \(max 10\)/i), image)
    await user.click(within(form).getByRole('button', { name: 'Add Property' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/sold.*not compatible/i)
    expect(api.post).not.toHaveBeenCalled()
  })

  it('keeps entered fields and API errors visible after a failed create', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockImplementation((url) => {
      if (url === '/upload') return Promise.resolve({ data: { urls: ['uploaded-image.jpg'] } }) as never
      return Promise.reject({
        response: { status: 503, data: { message: 'Property service is unavailable' } },
      }) as never
    })
    renderAdmin()
    await screen.findByText('Admin Dashboard')
    const form = await openPropertyForm(user)
    await fillRentalForm(user, 'Apartment', 'Keep this title')
    await user.upload(
      screen.getByLabelText(/images \(max 10\)/i),
      new File(['image data'], 'keep-on-error.jpg', { type: 'image/jpeg' }),
    )
    expect(await screen.findByAltText('Preview')).toBeInTheDocument()

    await user.click(within(form).getByRole('button', { name: 'Add Property' }))

    expect(await screen.findByText('Property service is unavailable')).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toHaveValue('Keep this title')
    expect(screen.getByLabelText(/location/i)).toHaveValue('Free-text location, Nairobi')
    expect(screen.getByLabelText(/monthly rent \(kes\)/i)).toHaveValue(100000)
    expect(screen.getByAltText('Preview')).toBeInTheDocument()
  })

  it('blocks create submission and modal close while feature creation is pending', async () => {
    const user = userEvent.setup()
    let finishFeatureCreate!: (response: { data: { _id: string; name: string } }) => void
    vi.mocked(api.post).mockImplementation((url) => {
      if (url === '/features') {
        return new Promise((resolve) => { finishFeatureCreate = resolve }) as never
      }
      return Promise.resolve({ data: {} }) as never
    })
    renderAdmin()
    await screen.findByText('Admin Dashboard')
    const form = await openPropertyForm(user)
    await fillRentalForm(user, 'Apartment', 'Keep while creating feature')
    const search = await screen.findByRole('searchbox', { name: /search or add a feature/i })
    await user.type(search, 'Garden sauna')
    await user.click(screen.getByRole('button', { name: /add feature: garden sauna/i }))

    const submit = within(form).getByRole('button', { name: 'Add Property' })
    expect(submit).toBeDisabled()
    fireEvent.submit(form)
    expect(api.post).not.toHaveBeenCalledWith('/properties', expect.anything())
    const cancel = within(form).getByRole('button', { name: 'Cancel' })
    const close = within(form).getByRole('button', { name: /close add property form/i })
    expect(cancel).toBeDisabled()
    expect(close).toBeDisabled()
    await user.click(cancel)
    await user.click(close)
    expect(screen.getByRole('heading', { name: 'Add Property' })).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalledWith('/properties', expect.anything())

    finishFeatureCreate({ data: { _id: 'feature-garden-sauna', name: 'Garden sauna' } })
    const selectedFeatures = await screen.findByRole('list', { name: /selected features/i })
    expect(await within(selectedFeatures).findByText('Garden sauna')).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toHaveValue('Keep while creating feature')
    expect(screen.getByRole('heading', { name: 'Add Property' })).toBeInTheDocument()
    expect(submit).toBeEnabled()
    expect(cancel).toBeEnabled()
    expect(close).toBeEnabled()
  })

  it('locks image selection and removal throughout upload and create, retaining images on failure', async () => {
    const user = userEvent.setup()
    let finishUpload!: (value: { data: { urls: string[] } }) => void
    let failCreate!: (error: Error) => void
    vi.mocked(api.post).mockImplementation((url) => {
      if (url === '/upload') return new Promise((resolve) => { finishUpload = resolve }) as never
      return new Promise((_, reject) => { failCreate = reject }) as never
    })
    renderAdmin()
    const form = await openPropertyForm(user)
    await fillRentalForm(user, 'Apartment')
    const input = screen.getByLabelText(/images \(max 10\)/i)
    await user.upload(input, new File(['fixture'], 'locked.jpg', { type: 'image/jpeg' }))
    const preview = await screen.findByAltText('Preview')
    const remove = preview.parentElement!.querySelector('button')!
    await user.click(within(form).getByRole('button', { name: 'Add Property' }))
    expect(input).toBeDisabled()
    expect(remove).toBeDisabled()
    await user.click(remove)
    expect(preview).toBeInTheDocument()
    finishUpload({ data: { urls: ['uploaded-fixture.jpg'] } })
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/properties', expect.objectContaining({ images: ['uploaded-fixture.jpg'] })))
    expect(input).toBeDisabled()
    expect(remove).toBeDisabled()
    failCreate(new Error('Fixture create failure'))
    await screen.findByText('Failed to add property')
    expect(input).toBeEnabled()
    expect(remove).toBeEnabled()
    expect(preview).toBeInTheDocument()
  })
})
