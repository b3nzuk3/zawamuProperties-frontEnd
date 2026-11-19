// API responses are explicit test fixtures; these tests do not contact a server or mail provider.
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import EnquiryForm from './EnquiryForm'

vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.post).mockResolvedValue({ data: { received: true, message: 'Your enquiry has been received.' } } as never)
})

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), ' Amina Njeri ')
  await user.type(screen.getByLabelText(/email address/i), 'amina@example.test')
  await user.type(screen.getByLabelText(/subject/i), 'Viewing information')
  await user.type(screen.getByLabelText(/message/i), 'Please share more details.')
}

describe('EnquiryForm', () => {
  it('posts a general enquiry with the existing phone, subject, and interest fields', async () => {
    const user = userEvent.setup()
    render(<EnquiryForm />)
    await fillRequiredFields(user)
    await user.type(screen.getByLabelText(/phone number/i), '0711168716')
    await user.selectOptions(screen.getByLabelText(/property interest/i), 'renting')
    await user.click(screen.getByRole('button', { name: /send enquiry/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalledOnce())
    expect(api.post).toHaveBeenCalledWith('/contact', {
      name: 'Amina Njeri',
      email: 'amina@example.test',
      message: 'Please share more details.',
      source: 'general',
      phone: '0711168716',
      subject: 'Viewing information',
      interest: 'renting',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Your enquiry has been received.')
    expect(screen.queryByText(/email sent/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toHaveValue('')
    expect(screen.getByLabelText(/message/i)).toHaveValue('')
  })

  it('includes property context and ID without using interest as a property category', async () => {
    const user = userEvent.setup()
    render(<EnquiryForm source="property" propertyId="listing-42" propertyTitle="Kilimani apartment" />)
    expect(screen.getByTestId('enquiry-property-context')).toHaveTextContent('Kilimani apartment')
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /send enquiry/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalledOnce())
    expect(api.post).toHaveBeenCalledWith('/contact', {
      name: 'Amina Njeri',
      email: 'amina@example.test',
      message: 'Please share more details.',
      source: 'property',
      subject: 'Viewing information',
      propertyId: 'listing-42',
    })
    expect(api.post).not.toHaveBeenCalledWith('/contact', expect.objectContaining({ interest: 'Apartment' }))
  })

  it('keeps entered values when the API rejects the submission', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockRejectedValueOnce({ response: { data: { message: 'Please try again later.' } } })
    render(<EnquiryForm />)
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /send enquiry/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Please try again later.')
    expect(screen.getByLabelText(/full name/i)).toHaveValue(' Amina Njeri ')
    expect(screen.getByLabelText(/email address/i)).toHaveValue('amina@example.test')
    expect(screen.getByLabelText(/message/i)).toHaveValue('Please share more details.')
  })

  it('does not clear values unless the response confirms the enquiry was received', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValueOnce({ data: { received: false, message: 'Not saved' } } as never)
    render(<EnquiryForm />)
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /send enquiry/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not confirm/i)
    expect(screen.getByLabelText(/full name/i)).toHaveValue(' Amina Njeri ')
  })

  it('uses a synchronous guard to prevent two submissions before React rerenders', async () => {
    let resolveSubmission!: (value: { data: { received: boolean; message: string } }) => void
    vi.mocked(api.post).mockReturnValueOnce(new Promise((resolve) => { resolveSubmission = resolve }) as never)
    const user = userEvent.setup()
    render(<EnquiryForm />)
    await fillRequiredFields(user)
    const form = screen.getByRole('form', { name: 'general enquiry' })
    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(api.post).toHaveBeenCalledOnce()
    expect(screen.getByLabelText(/full name/i)).toBeDisabled()
    expect(screen.getByLabelText(/message/i)).toBeDisabled()
    resolveSubmission({ data: { received: true, message: 'Received.' } })
    expect(await screen.findByRole('status')).toHaveTextContent('Received.')
    expect(screen.getByLabelText(/message/i)).toBeEnabled()
  })
})
