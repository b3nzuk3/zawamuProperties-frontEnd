import { describe, expect, it } from 'vitest'
import {
  buildPropertyPayload,
  calculateEffectivePrice,
  createPropertyForm,
  propertyToForm,
  validatePropertyForm,
} from './property'
import type { Property } from '@/types/property'

describe('property form helpers', () => {
  it('creates a blank sale form with safe defaults and text numeric values', () => {
    const form = createPropertyForm()

    expect(form).toEqual({
      title: '',
      description: '',
      listingPurpose: 'sale',
      availability: 'available',
      price: '',
      offerPercent: '0',
      location: '',
      type: 'Apartment',
      bedrooms: '0',
      bathrooms: '0',
      area: '0',
      featured: false,
      features: [],
    })
  })

  it('maps legacy properties without losing structured location or feature snapshots', () => {
    const property: Property = {
      _id: 'property-1',
      title: 'Older home',
      description: 'Original description',
      price: 120000,
      location: '  Westlands  ',
      type: 'Apartment',
      images: ['old-image.jpg'],
      features: ['Garden', 'Legacy fireplace'],
      bedrooms: 3,
      bathrooms: 2,
      area: 150,
      county: 'Nairobi',
      constituency: 'Westlands',
      ward: 'Kitisuru',
      coordinates: [36.8, -1.2],
    }

    expect(propertyToForm(property)).toMatchObject({
      title: 'Older home',
      description: 'Original description',
      listingPurpose: 'sale',
      availability: 'available',
      offerPercent: '0',
      location: 'Westlands',
      features: ['Garden', 'Legacy fireplace'],
      county: 'Nairobi',
      constituency: 'Westlands',
      ward: 'Kitisuru',
      coordinates: [36.8, -1.2],
    })
  })

  it('builds an editable-only payload and retains supplied images and legacy fields', () => {
    const form = {
      ...createPropertyForm(),
      title: '  City apartment ',
      description: ' Bright and airy ',
      listingPurpose: 'sale' as const,
      availability: 'sold' as const,
      price: '12000000',
      offerPercent: '12.5',
      location: ' Nairobi, Kenya ',
      type: 'Maisonette',
      bedrooms: '3',
      bathrooms: '2',
      area: '160',
      featured: true,
      features: ['Garden'],
      county: 'Nairobi',
      constituency: 'Westlands',
      ward: 'Kitisuru',
      coordinates: [36.8, -1.2] as [number, number],
    }

    const payload = buildPropertyPayload(form, ['image-1.jpg'])

    expect(payload).toEqual({
      title: 'City apartment',
      description: 'Bright and airy',
      price: 12000000,
      listingPurpose: 'sale',
      availability: 'sold',
      offerPercent: 12.5,
      location: 'Nairobi, Kenya',
      type: 'Maisonette',
      bedrooms: 3,
      bathrooms: 2,
      area: 160,
      featured: true,
      features: ['Garden'],
      images: ['image-1.jpg'],
      county: 'Nairobi',
      constituency: 'Westlands',
      ward: 'Kitisuru',
      coordinates: [36.8, -1.2],
    })
    expect(payload).not.toHaveProperty('_id')
    expect(payload).not.toHaveProperty('effectivePrice')
    expect(payload).not.toHaveProperty('listedBy')
  })

  it('always sends zero bedrooms and bathrooms for Land', () => {
    const form = { ...createPropertyForm(), type: 'Land', bedrooms: '8', bathrooms: '6' }
    expect(buildPropertyPayload(form, []).bedrooms).toBe(0)
    expect(buildPropertyPayload(form, []).bathrooms).toBe(0)
  })

  it('validates required trimmed fields, positive finite price and valid offers', () => {
    const form = createPropertyForm()
    expect(validatePropertyForm(form)).toMatch(/title/i)
    expect(validatePropertyForm({ ...form, title: ' Home ', description: ' Description ', price: '1', location: '   ' })).toMatch(/location/i)
    expect(validatePropertyForm({ ...form, title: 'Home', description: 'Description', price: 'Infinity', location: 'Nairobi' })).toMatch(/price/i)
    expect(validatePropertyForm({ ...form, title: 'Home', description: 'Description', price: '1', location: 'Nairobi', offerPercent: '1.234' })).toMatch(/offer/i)
    expect(validatePropertyForm({ ...form, title: 'Home', description: 'Description', price: '1', location: 'Nairobi', offerPercent: '100' })).toMatch(/offer/i)
  })

  it('rejects incompatible availability and rental-only property types', () => {
    const valid = {
      ...createPropertyForm(),
      title: 'Home',
      description: 'Description',
      price: '1',
      location: 'Nairobi',
    }
    expect(validatePropertyForm({ ...valid, availability: 'sold', listingPurpose: 'rent' })).toMatch(/availability/i)
    expect(validatePropertyForm({ ...valid, listingPurpose: 'rent', type: 'Maisonette' })).toMatch(/type/i)
    expect(validatePropertyForm({ ...valid, listingPurpose: 'rent', availability: 'rented', type: 'Land' })).toBeNull()
  })

  it('does not require bedroom or bathroom values for Land', () => {
    const form = {
      ...createPropertyForm(),
      title: 'Plot',
      description: 'Residential plot',
      price: '1000',
      location: 'Nairobi',
      type: 'Land',
      bedrooms: '',
      bathrooms: 'not applicable',
    }
    expect(validatePropertyForm(form)).toBeNull()
  })

  it('uses decimal half-up rounding for effective prices', () => {
    expect(calculateEffectivePrice(1.01, 50)).toBe(0.51)
    expect(calculateEffectivePrice(19.99, 10)).toBe(17.99)
    expect(calculateEffectivePrice(10, 0)).toBe(10)
    expect(calculateEffectivePrice(0, 10)).toBeNull()
    expect(calculateEffectivePrice(10, 100)).toBeNull()
  })
})
