// The API is mocked with DTO fixtures; no real enquiries or email retries are made.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import AdminEnquiries from './AdminEnquiries'
import type { Enquiry } from '@/types/contact'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))
vi.mock('@/components/layout/Layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))

const legacy: Enquiry = {
  _id: 'legacy-1',
  name: 'Legacy visitor',
  email: 'legacy@example.test',
  message: 'A historic three-field contact.',
}

function listResponse(items: Enquiry[], page = 1, pages = 1, total = items.length) {
  return { data: { items, page, pages, total, limit: 20 } }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockImplementation((url) => Promise.resolve({
    data: url === '/contact' ? listResponse([legacy]).data : legacy,
  }) as never)
  vi.mocked(api.post).mockResolvedValue({ data: { ...legacy, notification: { status: 'failed', attempts: 1 } } } as never)
  vi.mocked(api.patch).mockResolvedValue({ data: { ...legacy, status: 'read', notification: { status: 'pending', attempts: 0 } } } as never)
})

describe('AdminEnquiries', () => {
  it('refreshes filtered totals after a status update removes an enquiry from the current page', async () => {
    const user = userEvent.setup()
    let resolved = false
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/contact') return Promise.resolve({ data: legacy }) as never
      const params = config?.params as Record<string, unknown>
      return Promise.resolve(listResponse(params.status === 'new' && resolved ? [] : [legacy])) as never
    })
    vi.mocked(api.patch).mockImplementation(() => {
      resolved = true
      return Promise.resolve({ data: { ...legacy, status: 'resolved' } }) as never
    })
    render(<AdminEnquiries />)
    await screen.findByText('Legacy visitor')
    await user.selectOptions(screen.getByLabelText('Status'), 'new')
    await user.click(await screen.findByRole('button', { name: 'Open enquiry from Legacy visitor' }))
    await screen.findByText('Attempts: 0 of 5')
    await user.click(screen.getByRole('button', { name: 'Resolved' }))
    const results = screen.getByRole('region', { name: 'Enquiry results' })
    expect(await within(results).findByText('No enquiries found')).toBeInTheDocument()
    expect(within(results).queryByText('Legacy visitor')).not.toBeInTheDocument()
  })

  it('loads server-side pages and sends source/status filters to the API', async () => {
    const user = userEvent.setup()
    const property = { ...legacy, _id: 'property-2', name: 'Property visitor', source: 'property' as const }
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/contact') return Promise.resolve({ data: legacy }) as never
      const params = config?.params as Record<string, unknown>
      if (params.page === 2) return Promise.resolve(listResponse([{ ...legacy, _id: 'page-2', name: 'Second page' }], 2, 3, 41)) as never
      if (params.source === 'property') return Promise.resolve(listResponse([property])) as never
      if (params.status === 'resolved') return Promise.resolve(listResponse([{ ...legacy, _id: 'resolved-1', status: 'resolved' }])) as never
      return Promise.resolve(listResponse([legacy], 1, 3, 41)) as never
    })
    render(<AdminEnquiries />)

    expect(await screen.findByText('Legacy visitor')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/contact', { params: { page: 1, limit: 20 } })
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Second page')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/contact', { params: { page: 2, limit: 20 } })

    await user.selectOptions(screen.getByLabelText('Source'), 'property')
    expect(await screen.findByText('Property visitor')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/contact', { params: { page: 1, limit: 20, source: 'property' } })

    await user.selectOptions(screen.getByLabelText('Status'), 'resolved')
    expect(await screen.findByText('Resolved')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/contact', { params: { page: 1, limit: 20, status: 'resolved', source: 'property' } })
  })

  it('safely renders a legacy three-field record and supports status updates and notification retry', async () => {
    const user = userEvent.setup()
    render(<AdminEnquiries />)
    await user.click(await screen.findByRole('button', { name: 'Open enquiry from Legacy visitor' }))

    const detail = screen.getByRole('region', { name: 'Enquiry detail' })
    expect(await within(detail).findByText('A historic three-field contact.')).toBeInTheDocument()
    expect(within(detail).getByText('General enquiry')).toBeInTheDocument()
    expect(within(detail).getByText(/Received:\s*Date unavailable/)).toBeInTheDocument()
    expect(within(detail).getByText('Attempts: 0 of 5')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Read' }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/contact/legacy-1', { status: 'read' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Enquiry status updated.')

    await user.click(screen.getByRole('button', { name: 'Retry notification' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/contact/legacy-1/retry-notification'))
    expect(await screen.findByRole('status')).toHaveTextContent(/retry processed/i)
    expect(within(detail).getByText('failed')).toBeInTheDocument()
    expect(within(detail).getByText('Attempts: 1 of 5')).toBeInTheDocument()
  })

  it.each([
    ['sent', 1],
    ['sending', 1],
    ['failed', 5],
  ] as const)('disables retry when notification is %s after %s attempts', async (status, attempts) => {
    const user = userEvent.setup()
    const item: Enquiry = { ...legacy, notification: { status, attempts } }
    vi.mocked(api.get).mockImplementation((url) => Promise.resolve({
      data: url === '/contact' ? listResponse([item]).data : item,
    }) as never)
    render(<AdminEnquiries />)
    await user.click(await screen.findByRole('button', { name: 'Open enquiry from Legacy visitor' }))
    await screen.findByText(`Attempts: ${attempts} of 5`)
    expect(screen.getByRole('button', { name: 'Retry notification' })).toBeDisabled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows property snapshot, visitor contact details, and mail failure state', async () => {
    const user = userEvent.setup()
    const propertyEnquiry: Enquiry = {
      ...legacy,
      _id: 'property-enquiry',
      source: 'property',
      phone: '+254711168716',
      subject: 'Question about the house',
      interest: 'renting',
      propertyId: 'listing-42',
      propertyTitle: 'Kileleshwa house',
      propertyUrl: '/listings/listing-42',
      createdAt: '2026-11-18T10:30:00.000Z',
      notification: { status: 'failed', attempts: 4, lastError: 'SMTP unavailable' },
    }
    vi.mocked(api.get).mockImplementation((url) => Promise.resolve({
      data: url === '/contact' ? listResponse([propertyEnquiry]).data : propertyEnquiry,
    }) as never)
    render(<AdminEnquiries />)
    await user.click(await screen.findByRole('button', { name: 'Open enquiry from Legacy visitor' }))

    const detail = screen.getByRole('region', { name: 'Enquiry detail' })
    expect(await within(detail).findByText('Kileleshwa house')).toBeInTheDocument()
    expect(within(detail).getByRole('link', { name: 'View property listing' })).toHaveAttribute('href', '/listings/listing-42')
    expect(within(detail).getByRole('link', { name: '+254711168716' })).toHaveAttribute('href', 'tel:+254711168716')
    expect(within(detail).getByText('SMTP unavailable')).toBeInTheDocument()
    expect(within(detail).getByText('Attempts: 4 of 5')).toBeInTheDocument()
    expect(within(detail).getByRole('button', { name: 'Retry notification' })).toBeEnabled()
  })

  it.each([
    'javascript:alert(1)',
    'https://attacker.example.test/listings/fake',
    '//attacker.example.test/listings/fake',
  ])('does not render an unsafe historical property destination: %s', async (propertyUrl) => {
    const user = userEvent.setup()
    const propertyEnquiry: Enquiry = {
      ...legacy,
      source: 'property',
      propertyTitle: 'Historic property snapshot',
      propertyUrl,
    }
    vi.mocked(api.get).mockImplementation((url) => Promise.resolve({
      data: url === '/contact' ? listResponse([propertyEnquiry]).data : propertyEnquiry,
    }) as never)
    render(<AdminEnquiries />)

    await user.click(await screen.findByRole('button', { name: 'Open enquiry from Legacy visitor' }))
    const detail = screen.getByRole('region', { name: 'Enquiry detail' })
    expect(await within(detail).findByText('Historic property snapshot')).toBeInTheDocument()
    expect(within(detail).queryByRole('link', { name: 'View property listing' })).not.toBeInTheDocument()
  })

  it('prefers a local listing route from a valid property ID over the snapshot URL', async () => {
    const user = userEvent.setup()
    const propertyEnquiry: Enquiry = {
      ...legacy,
      source: 'property',
      propertyId: 'listing-safe_42',
      propertyTitle: 'Safe property snapshot',
      propertyUrl: 'javascript:alert(1)',
    }
    vi.mocked(api.get).mockImplementation((url) => Promise.resolve({
      data: url === '/contact' ? listResponse([propertyEnquiry]).data : propertyEnquiry,
    }) as never)
    render(<AdminEnquiries />)

    await user.click(await screen.findByRole('button', { name: 'Open enquiry from Legacy visitor' }))
    expect(await screen.findByRole('link', { name: 'View property listing' })).toHaveAttribute('href', '/listings/listing-safe_42')
  })

  it('preserves a valid same-origin listing path for a historical snapshot without an ID', async () => {
    const user = userEvent.setup()
    const propertyEnquiry: Enquiry = {
      ...legacy,
      source: 'property',
      propertyTitle: 'Historic property snapshot',
      propertyUrl: `${window.location.origin}/listings/listing-legacy?source=enquiry`,
    }
    vi.mocked(api.get).mockImplementation((url) => Promise.resolve({
      data: url === '/contact' ? listResponse([propertyEnquiry]).data : propertyEnquiry,
    }) as never)
    render(<AdminEnquiries />)

    await user.click(await screen.findByRole('button', { name: 'Open enquiry from Legacy visitor' }))
    expect(await screen.findByRole('link', { name: 'View property listing' })).toHaveAttribute('href', '/listings/listing-legacy?source=enquiry')
  })

  it('keeps the open detail when the already-selected enquiry row is clicked again', async () => {
    const user = userEvent.setup()
    render(<AdminEnquiries />)
    const openButton = await screen.findByRole('button', { name: 'Open enquiry from Legacy visitor' })
    await user.click(openButton)
    const detail = screen.getByRole('region', { name: 'Enquiry detail' })
    expect(await within(detail).findByText('A historic three-field contact.')).toBeInTheDocument()

    await user.click(openButton)

    expect(within(detail).getByText('A historic three-field contact.')).toBeInTheDocument()
    expect(within(detail).queryByText('Enquiry details are unavailable.')).not.toBeInTheDocument()
    expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === '/contact/legacy-1')).toHaveLength(1)
  })

  it('returns to the last available page when a mutation empties the current last page', async () => {
    const user = userEvent.setup()
    const first = { ...legacy, _id: 'page-one', name: 'First page visitor' }
    const last = { ...legacy, _id: 'page-two', name: 'Last page visitor' }
    let lastItemResolved = false
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/contact') return Promise.resolve({ data: last }) as never
      const params = config?.params as Record<string, unknown>
      if (params.status !== 'new') return Promise.resolve(listResponse([first])) as never
      if (params.page === 2) {
        return Promise.resolve(lastItemResolved
          ? listResponse([], 2, 1, 20)
          : listResponse([last], 2, 2, 21)) as never
      }
      return Promise.resolve(lastItemResolved
        ? listResponse([first], 1, 1, 20)
        : listResponse([first], 1, 2, 21)) as never
    })
    vi.mocked(api.patch).mockImplementation(() => {
      lastItemResolved = true
      return Promise.resolve({ data: { ...last, status: 'resolved' } }) as never
    })
    render(<AdminEnquiries />)

    await screen.findByText('First page visitor')
    await user.selectOptions(screen.getByLabelText('Status'), 'new')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(await screen.findByRole('button', { name: 'Open enquiry from Last page visitor' }))
    const detail = screen.getByRole('region', { name: 'Enquiry detail' })
    await within(detail).findByText('A historic three-field contact.')
    await user.click(within(detail).getByRole('button', { name: 'Resolved' }))

    expect(await screen.findByText(/Page 1 of 1/)).toBeInTheDocument()
    expect(screen.getByText('First page visitor')).toBeInTheDocument()
    expect(screen.queryByText('No enquiries found')).not.toBeInTheDocument()
  })

  it('ignores stale detail responses after another enquiry is selected', async () => {
    const user = userEvent.setup()
    const first = { ...legacy, _id: 'first', name: 'First visitor' }
    const second = { ...legacy, _id: 'second', name: 'Second visitor', message: 'The current selected message.' }
    const resolvers = new Map<string, (value: { data: Enquiry }) => void>()
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/contact') return Promise.resolve(listResponse([first, second])) as never
      return new Promise((resolve) => { resolvers.set(url, resolve) }) as never
    })
    render(<AdminEnquiries />)

    await user.click(await screen.findByRole('button', { name: 'Open enquiry from First visitor' }))
    await waitFor(() => expect(resolvers.has('/contact/first')).toBe(true))
    await user.click(screen.getByRole('button', { name: 'Open enquiry from Second visitor' }))
    await waitFor(() => expect(resolvers.has('/contact/second')).toBe(true))
    resolvers.get('/contact/second')?.({ data: second })
    const detail = screen.getByRole('region', { name: 'Enquiry detail' })
    expect(await within(detail).findByText('The current selected message.')).toBeInTheDocument()
    resolvers.get('/contact/first')?.({ data: { ...first, message: 'A stale message from another enquiry.' } })

    await waitFor(() => expect(within(detail).queryByText('A stale message from another enquiry.')).not.toBeInTheDocument())
    expect(within(detail).getByText('The current selected message.')).toBeInTheDocument()
  })

  it('ignores older list responses after a filter changes', async () => {
    const user = userEvent.setup()
    const filtered = { ...legacy, _id: 'filtered', name: 'Filtered property enquiry', source: 'property' as const }
    let resolveInitial!: (value: ReturnType<typeof listResponse>) => void
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/contact') return Promise.resolve({ data: legacy }) as never
      const params = config?.params as Record<string, unknown>
      if (params.source === 'property') return Promise.resolve(listResponse([filtered])) as never
      return new Promise((resolve) => { resolveInitial = resolve }) as never
    })
    render(<AdminEnquiries />)
    await user.selectOptions(screen.getByLabelText('Source'), 'property')
    expect(await screen.findByText('Filtered property enquiry')).toBeInTheDocument()
    resolveInitial(listResponse([{ ...legacy, name: 'Stale unfiltered enquiry' }]))

    await waitFor(() => expect(screen.queryByText('Stale unfiltered enquiry')).not.toBeInTheDocument())
    expect(screen.getByText('Filtered property enquiry')).toBeInTheDocument()
  })

  it.each(['status', 'retry'] as const)('does not show a stale %s response in another enquiry detail', async (kind) => {
    const user = userEvent.setup()
    const first = { ...legacy, _id: 'first-action', name: 'First action visitor', notification: { status: 'failed' as const, attempts: 1 } }
    const second = { ...legacy, _id: 'second-action', name: 'Second action visitor', message: 'Second enquiry stays selected.' }
    let resolveAction!: (value: { data: Enquiry }) => void
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/contact') return Promise.resolve(listResponse([first, second])) as never
      return Promise.resolve({ data: url.endsWith('/first-action') ? first : second }) as never
    })
    const delayedAction = new Promise<{ data: Enquiry }>((resolve) => { resolveAction = resolve })
    if (kind === 'status') vi.mocked(api.patch).mockReturnValueOnce(delayedAction as never)
    else vi.mocked(api.post).mockReturnValueOnce(delayedAction as never)
    render(<AdminEnquiries />)

    await user.click(await screen.findByRole('button', { name: 'Open enquiry from First action visitor' }))
    const detail = screen.getByRole('region', { name: 'Enquiry detail' })
    await within(detail).findByText('A historic three-field contact.')
    if (kind === 'status') await user.click(within(detail).getByRole('button', { name: 'Read' }))
    else await user.click(within(detail).getByRole('button', { name: 'Retry notification' }))

    await user.click(screen.getByRole('button', { name: 'Open enquiry from Second action visitor' }))
    await within(detail).findByText('Second enquiry stays selected.')
    resolveAction({ data: { ...first, status: 'read', notification: { status: 'sent', attempts: 2 } } })

    await waitFor(() => expect(within(detail).queryByText(/Enquiry status updated|retry processed/i)).not.toBeInTheDocument())
    expect(within(detail).getByText('Second enquiry stays selected.')).toBeInTheDocument()
  })
})
