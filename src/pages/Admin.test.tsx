// Admin alert checks use a mocked Axios transport and never send real email.
import { render, screen, waitFor, within } from '@testing-library/react'
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

const expectedImageAccept = 'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif'

function expectOriginalImageUpload(file: File) {
  const uploadCall = vi.mocked(api.post).mock.calls.find(([path]) => path === '/upload')
  expect(uploadCall).toBeDefined()
  const formData = uploadCall?.[1]
  expect(formData).toBeInstanceOf(FormData)
  const uploadedFiles = (formData as FormData).getAll('images')
  expect(uploadedFiles).toHaveLength(1)
  expect(uploadedFiles[0]).toBe(file)
  expect(uploadedFiles[0]).toMatchObject({ name: file.name, type: file.type, size: file.size })
}

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

describe('admin HEIC image uploads', () => {
  it('shows a HEIC placeholder and submits the original file for property creation', async () => {
    const user = userEvent.setup()
    const file = new File(['original property HEIC bytes'], 'new-property.heic', { type: 'image/heic' })
    vi.mocked(api.post).mockImplementation(async (path) => (
      path === '/upload' ? { data: { urls: ['uploaded-image.webp'] } } : { data: {} }
    ) as never)
    render(<MemoryRouter><Admin /></MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: 'Add Property' }))
    await user.type(screen.getByLabelText('Title'), 'HEIC test home')
    await user.type(screen.getByLabelText('Description'), 'Created from the original HEIC upload.')
    await user.type(screen.getByLabelText('Location'), 'Nairobi')
    await user.type(screen.getByLabelText('Sale price (KES)'), '25000000')

    const input = screen.getByLabelText(/Images \(max 10\)/i)
    expect(input).toHaveAttribute('accept', expectedImageAccept)
    expect(screen.getByText(/max 8 MiB and 24 MP per image/i)).toBeInTheDocument()
    await user.upload(input, file)
    expect(await screen.findByRole('img', { name: 'Selected file: new-property.heic' })).toBeInTheDocument()
    expect(screen.getByText('HEIC/HEIF preview unavailable')).toBeInTheDocument()
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument()

    const form = screen.getByRole('heading', { name: 'Add Property' }).closest('form')!
    await user.click(within(form).getByRole('button', { name: 'Add Property' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/properties', expect.objectContaining({
      title: 'HEIC test home',
      images: ['uploaded-image.webp'],
    })))
    expectOriginalImageUpload(file)
  })

  it('shows a HEIF placeholder and submits the original file for a blog post', async () => {
    const user = userEvent.setup()
    const file = new File(['original blog HEIF bytes'], 'editorial.heif', { type: 'image/heif' })
    vi.mocked(api.post).mockImplementation(async (path) => (
      path === '/upload' ? { data: { urls: ['uploaded-image.webp'] } } : { data: {} }
    ) as never)
    render(<MemoryRouter><Admin /></MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: 'New Post' }))
    await user.type(screen.getByLabelText('Title'), 'HEIF blog image')

    const input = screen.getByLabelText('Image')
    expect(input).toHaveAttribute('accept', expectedImageAccept)
    expect(screen.getByText(/max 8 MiB and 24 MP per image/i)).toBeInTheDocument()
    await user.upload(input, file)
    expect(await screen.findByRole('img', { name: 'Selected file: editorial.heif' })).toBeInTheDocument()
    expect(screen.getByText('HEIC/HEIF preview unavailable')).toBeInTheDocument()
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add Post' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/blog', expect.objectContaining({
      title: 'HEIF blog image',
      image: 'uploaded-image.webp',
    })))
    expectOriginalImageUpload(file)
  })
})
