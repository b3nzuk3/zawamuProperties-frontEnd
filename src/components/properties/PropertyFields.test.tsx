import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createPropertyForm } from '@/lib/property'
import { PropertyFields } from './PropertyFields'

vi.mock('./FeatureSelect', () => ({
  FeatureSelect: ({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) => (
    <button type="button" onClick={() => onChange([...value, 'Garden'])}>Add Garden feature</button>
  ),
}))

function renderFields(overrides: Partial<ReturnType<typeof createPropertyForm>> = {}) {
  const onChange = vi.fn()
  const value = { ...createPropertyForm(), ...overrides }
  const rendered = render(<PropertyFields value={value} onChange={onChange} />)
  return { onChange, value, rerender: rendered.rerender }
}

describe('PropertyFields', () => {
  it('renders the editable property fields and reports the live discounted price', async () => {
    const user = userEvent.setup()
    const { onChange } = renderFields({ title: 'Home', description: 'Bright', location: 'Nairobi', price: '1000', offerPercent: '12.5' })

    expect(screen.getByLabelText(/title/i)).toHaveValue('Home')
    expect(screen.getByLabelText(/description/i)).toHaveValue('Bright')
    expect(screen.getByLabelText(/location/i)).toHaveValue('Nairobi')
    expect(screen.getByLabelText(/sale price \(kes\)/i)).toHaveValue(1000)
    expect(screen.getByText(/effective price preview/i)).toBeInTheDocument()
    expect(screen.getByText(/kes\s?875(?:\.00)?/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /add garden feature/i }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ features: ['Garden'] }))
    expect(screen.getByRole('group', { name: /features/i })).toBeInTheDocument()
  })

  it('uses monthly rent labels and limits rental types to the supported choices', () => {
    renderFields({ listingPurpose: 'rent' })
    expect(screen.getByLabelText(/monthly rent \(kes\)/i)).toBeInTheDocument()
    const typeSelect = screen.getByLabelText(/property type/i)
    expect(within(typeSelect).getByRole('option', { name: 'Land' })).toBeInTheDocument()
    expect(within(typeSelect).queryByRole('option', { name: 'Maisonette' })).not.toBeInTheDocument()
  })

  it('requires a compatible availability after a purpose switch without silently changing Sold', async () => {
    const user = userEvent.setup()
    const { onChange, rerender } = renderFields({ availability: 'sold' })
    await user.selectOptions(screen.getByLabelText(/listing purpose/i), 'rent')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ listingPurpose: 'rent', availability: 'sold' }))
    const nextValue = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0]
    expect(nextValue).toBeDefined()
    rerender(<PropertyFields value={nextValue!} onChange={onChange} />)

    const availability = screen.getByLabelText(/availability/i)
    expect(availability).toHaveValue('sold')
    expect(screen.getByRole('alert')).toHaveTextContent(/sold is not compatible with for rent/i)
    expect(within(availability).getByRole('option', { name: /sold.*choose compatible/i })).toBeDisabled()
  })

  it('hides bedrooms and bathrooms for Land and disables controls when requested', () => {
    render(<PropertyFields value={{ ...createPropertyForm(), type: 'Land' }} onChange={vi.fn()} disabled />)
    expect(screen.queryByLabelText(/bedrooms/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/bathrooms/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toBeDisabled()
    expect(screen.getByLabelText(/property type/i)).toBeDisabled()
  })
})
