// The contact page submits to a mocked API response; no live backend or email is used.
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import Contact from './Contact'

vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }))
vi.mock('@/components/layout/Layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.post).mockResolvedValue({ data: { received: true, message: 'Your enquiry has been received.' } } as never)
})

it('keeps the public contact page and submits its general form through the API', async () => {
  const user = userEvent.setup()
  render(<Contact />)
  expect(screen.getByRole('heading', { name: 'Get in Touch' })).toBeInTheDocument()
  expect(screen.getByRole('form', { name: 'general enquiry' })).toBeInTheDocument()

  await user.type(screen.getByLabelText(/full name/i), 'Musa Otieno')
  await user.type(screen.getByLabelText(/email address/i), 'musa@example.test')
  await user.selectOptions(screen.getByLabelText(/property interest/i), 'buying')
  await user.type(screen.getByLabelText(/subject/i), 'Buying advice')
  await user.type(screen.getByLabelText(/message/i), 'I would like to discuss options.')
  await user.click(screen.getByRole('button', { name: /send enquiry/i }))

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/contact', expect.objectContaining({
    name: 'Musa Otieno',
    email: 'musa@example.test',
    source: 'general',
    interest: 'buying',
    subject: 'Buying advice',
    message: 'I would like to discuss options.',
  })))
  expect(await screen.findByRole('status')).toHaveTextContent('Your enquiry has been received.')
})
