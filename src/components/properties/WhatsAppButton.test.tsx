import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Property } from '@/types/property'
import { WhatsAppButton } from './WhatsAppButton'

const property: Property = {
  _id: 'listing-123',
  title: 'Kilimani apartment',
  description: 'Bright apartment',
  price: 100_000,
  location: 'Kilimani',
  type: 'Apartment',
}

describe('WhatsAppButton', () => {
  it('is a keyboard-accessible safe new-tab link and does not trigger a parent card link', () => {
    const parentClick = vi.fn()
    render(
      <div onClick={parentClick}>
        <WhatsAppButton property={property} className="button-extra" />
      </div>,
    )
    const link = screen.getByRole('link', { name: /contact about kilimani apartment on whatsapp/i })

    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveClass('button-extra')
    expect(link).not.toHaveAttribute('tabindex', '-1')
    const whatsappUrl = new URL(link.getAttribute('href')!)
    expect(whatsappUrl.searchParams.get('text')).toContain(
      `${window.location.origin}/listings/listing-123`,
    )
    expect(whatsappUrl.searchParams.get('text')).toContain(property.title)
    expect(whatsappUrl.searchParams.get('text')).not.toContain('/api/')
    fireEvent.click(link)
    expect(parentClick).not.toHaveBeenCalled()
  })

  it('omits the link when the canonical _id is missing', () => {
    render(<WhatsAppButton property={{ ...property, _id: undefined }} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
