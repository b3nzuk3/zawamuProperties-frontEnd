import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Property } from '@/types/property'
import { PropertyBadges } from './PropertyBadges'

const property: Property = {
  _id: 'property-123',
  title: 'Kilimani apartment',
  description: 'Bright apartment',
  price: 100_000,
  location: 'Kilimani',
  type: 'Apartment',
  listingPurpose: 'rent',
  availability: 'rented',
  offerPercent: 12.5,
  featured: true,
}

describe('PropertyBadges', () => {
  it.each([null, 'withdrawn', ''])('does not label unknown historical availability %s as Available', (availability) => {
    render(<PropertyBadges property={{ ...property, availability } as unknown as Property} />)
    expect(screen.queryByText('Available')).not.toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })
  it('shows purpose, featured, offer, and unavailable status as readable wrapping badges', () => {
    const { container } = render(<PropertyBadges property={property} className="extra-class" />)

    expect(screen.getByText('For Rent')).toBeInTheDocument()
    expect(screen.getByText('Featured')).toBeInTheDocument()
    expect(screen.getByText('12.5% off')).toBeInTheDocument()
    expect(screen.getByText('Rented')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('flex-wrap', 'extra-class')
  })

  it('marks an available legacy property without inventing a purpose or offer badge', () => {
    render(<PropertyBadges property={{ ...property, listingPurpose: undefined, availability: undefined, offerPercent: 0, featured: false }} />)

    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.queryByText('For Sale')).not.toBeInTheDocument()
    expect(screen.queryByText('For Rent')).not.toBeInTheDocument()
    expect(screen.queryByText(/off$/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Featured')).not.toBeInTheDocument()
  })
})
