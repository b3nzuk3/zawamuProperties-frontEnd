// API and toast responses are explicit mocks; no server or network is used.
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import { ScheduleViewingModal } from './schedule-viewing-modal'

vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }))

const postViewing = vi.mocked(api.post)

beforeEach(() => {
  vi.clearAllMocks()
  postViewing.mockResolvedValue({ data: {} } as never)
})

function renderModal(propertyId = 'property-1') {
  return render(
    <MemoryRouter>
      <ScheduleViewingModal propertyId={propertyId} propertyTitle="Garden home">
        <button type="button">Request a viewing</button>
      </ScheduleViewingModal>
    </MemoryRouter>,
  )
}

async function openAndFillForm() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /request a viewing/i }))
  await user.type(screen.getByLabelText(/full name/i), 'Amina Visitor')
  await user.type(screen.getByLabelText(/^email/i), 'amina@example.test')
  await user.type(screen.getByLabelText(/phone number/i), '0712345678')
  await user.type(screen.getByLabelText(/preferred date/i), '2030-04-05')
  await user.type(screen.getByLabelText(/additional message/i), 'Please call first.')
  return user
}

describe('ScheduleViewingModal availability conflicts', () => {
  it('shows an inline conflict, preserves inputs, and keeps the same listing blocked after reopen', async () => {
    const user = userEvent.setup()
    postViewing.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: 'This property is sold and is no longer available for viewings.' },
      },
    } as never)
    renderModal()

    await openAndFillForm()
    const form = screen.getByRole('button', { name: 'Schedule Viewing' }).closest('form')!
    fireEvent.submit(form)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/no longer available for viewings/i)
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Amina Visitor')
    expect(screen.getByLabelText(/^email/i)).toHaveValue('amina@example.test')
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('0712345678')
    expect(screen.getByLabelText(/preferred date/i)).toHaveValue('2030-04-05')
    expect(screen.getByLabelText(/additional message/i)).toHaveValue('Please call first.')
    expect(screen.getByRole('button', { name: 'Schedule Viewing' })).toBeDisabled()
    expect(screen.getByRole('link', { name: /contact us to enquire/i })).toHaveAttribute('href', '/contact')
    fireEvent.submit(form)
    expect(postViewing).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(screen.getByRole('button', { name: /request a viewing/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/no longer available for viewings/i)
    expect(screen.getByRole('button', { name: 'Schedule Viewing' })).toBeDisabled()
    fireEvent.submit(screen.getByRole('button', { name: 'Schedule Viewing' }).closest('form')!)
    expect(postViewing).toHaveBeenCalledTimes(1)
  })

  it('blocks duplicate submissions while pending and permits retry after ordinary errors', async () => {
    let rejectFirst!: (error: unknown) => void
    postViewing.mockReturnValueOnce(new Promise((_, reject) => { rejectFirst = reject }) as never)
    postViewing.mockResolvedValueOnce({ data: {} } as never)
    renderModal()

    await openAndFillForm()
    const form = screen.getByRole('button', { name: 'Schedule Viewing' }).closest('form')!
    const submit = screen.getByRole('button', { name: 'Schedule Viewing' })
    fireEvent.submit(form)
    await waitFor(() => expect(postViewing).toHaveBeenCalledTimes(1))
    fireEvent.submit(form)
    expect(postViewing).toHaveBeenCalledTimes(1)
    expect(submit).toBeDisabled()

    rejectFirst({ response: { status: 503, data: { message: 'Temporarily unavailable' } } })
    await waitFor(() => expect(submit).toBeEnabled())
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Amina Visitor')

    fireEvent.submit(form)
    await waitFor(() => expect(postViewing).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Schedule a Viewing' })).not.toBeInTheDocument())
  })
})
