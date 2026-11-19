import { describe, expect, it } from 'vitest'
import type { Property } from '@/types/property'
import {
  matchesSavedSearchCriteria,
  normalizeSavedSearchPropertyType,
  parseSavedSearchCriteria,
  summarizeSavedSearchCriteria,
  validateSavedSearchCriteria,
} from './savedSearch'

const property = (overrides: Partial<Property> = {}): Property => ({
  _id: 'listing-1',
  title: 'Westlands apartment',
  description: 'Three bedrooms near shops',
  price: 100_000.99,
  effectivePrice: 90_000.25,
  offerPercent: 10,
  location: 'Kileleshwa',
  county: 'Nairobi',
  constituency: 'Westlands',
  ward: 'Parklands',
  type: 'Apartment',
  listingPurpose: 'rent',
  availability: 'available',
  bedrooms: 3,
  bathrooms: 2,
  area: 80,
  ...overrides,
})

describe('saved search criteria', () => {
  it('parses supported criteria while preserving zero bounds and legacy constraints', () => {
    expect(parseSavedSearchCriteria(JSON.stringify({
      location: 'Kileleshwa',
      listingPurpose: 'rent',
      propertyTypes: ['apartment', 'house', 'commercial', 'office', 'land'],
      minPrice: 0,
      maxPrice: 100_000.25,
      county: 'Nairobi',
      constituency: 'Westlands',
      ward: 'Parklands',
      minBedrooms: 2,
      maxBedrooms: 4,
      minBathrooms: 1,
      maxBathrooms: 3,
      searchTerm: 'shops',
    }))).toEqual({
      valid: true,
      criteria: {
        location: 'Kileleshwa',
        listingPurpose: 'rent',
        propertyTypes: ['Apartment', 'house', 'commercial', 'Office space', 'Land'],
        minPrice: 0,
        maxPrice: 100_000.25,
        county: 'Nairobi',
        constituency: 'Westlands',
        ward: 'Parklands',
        minBedrooms: 2,
        maxBedrooms: 4,
        minBathrooms: 1,
        maxBathrooms: 3,
        searchTerm: 'shops',
      },
      error: null,
    })
    expect(parseSavedSearchCriteria('{broken').valid).toBe(false)
    expect(parseSavedSearchCriteria(JSON.stringify({ listingPurpose: 'lease' })).valid).toBe(false)
    // Recognized legacy "all" sentinel is intentionally treated as no county filter.
    expect(validateSavedSearchCriteria({ county: 'all' })).toEqual({
      valid: true,
      criteria: {},
      error: null,
    })
  })

  it('normalizes only the three exact legacy aliases and keeps ambiguous types literal', () => {
    expect(normalizeSavedSearchPropertyType('apartment')).toBe('Apartment')
    expect(normalizeSavedSearchPropertyType('land')).toBe('Land')
    expect(normalizeSavedSearchPropertyType('office')).toBe('Office space')
    expect(normalizeSavedSearchPropertyType('house')).toBe('house')
    expect(normalizeSavedSearchPropertyType('commercial')).toBe('commercial')
    expect(normalizeSavedSearchPropertyType('Apartment')).toBe('Apartment')
    expect(validateSavedSearchCriteria({ propertyTypes: ['commercial', 'house'] }).criteria?.propertyTypes)
      .toEqual(['commercial', 'house'])
  })

  it('fails closed on unknown keys, invalid types/purpose, bad numbers, and reversed bounds', () => {
    const invalidCriteria = [
      { minPrice: 0, unknownConstraint: 'future' },
      { listingPurpose: 'lease' },
      { propertyTypes: ['offices'] },
      { minPrice: -1 },
      { maxPrice: Number.POSITIVE_INFINITY },
      { minPrice: 5, maxPrice: 4 },
    ]
    invalidCriteria.forEach((criteria) => {
      expect(validateSavedSearchCriteria(criteria).valid).toBe(false)
      expect(matchesSavedSearchCriteria(property(), criteria)).toBe(false)
    })
    expect(parseSavedSearchCriteria(JSON.stringify({ county: 'Nairobi', searchType: 'condo' })).valid)
      .toBe(false)
  })

  it('summarizes location, purpose, types, zero/cents bounds, bedrooms, bathrooms and term', () => {
    const summary = summarizeSavedSearchCriteria({
      location: 'Kileleshwa',
      listingPurpose: 'rent',
      propertyTypes: ['Apartment'],
      minPrice: 0,
      maxPrice: 125_000.25,
      minBedrooms: 0,
      maxBedrooms: 3,
      minBathrooms: 1,
      searchTerm: 'near shops',
    })

    expect(summary).toContain('Kileleshwa')
    expect(summary).toContain('For Rent')
    expect(summary).toContain('Apartment')
    expect(summary).toContain('KSh 0')
    expect(summary).toContain('KSh 125,000.25 / month')
    expect(summary).toContain('Bedrooms: 0 - 3')
    expect(summary).toContain('Bathrooms: 1 - Any')
    expect(summary).toContain('Search: "near shops"')
  })

  it('labels ambiguous legacy types as exact matches rather than broadening them', () => {
    const summary = summarizeSavedSearchCriteria({ propertyTypes: ['house', 'commercial'] })
    expect(summary).toContain('house (exact legacy type)')
    expect(summary).toContain('commercial (exact legacy type)')
    expect(summary).not.toContain('Bungalow')
    expect(summary).not.toContain('Office space')
  })

  it('matches effective price, manual location, taxonomy, purpose and zero bounds', () => {
    const candidate = property()
    expect(matchesSavedSearchCriteria(candidate, {
      location: 'KILEL',
      listingPurpose: 'rent',
      propertyTypes: ['apartment'],
      minPrice: 0,
      maxPrice: 90_000.25,
      minBedrooms: 3,
      maxBedrooms: 3,
      minBathrooms: 2,
    })).toBe(true)
    expect(matchesSavedSearchCriteria(property({ effectivePrice: 90_000.26 }), {
      maxPrice: 90_000.25,
    })).toBe(false)
    expect(matchesSavedSearchCriteria(property({ bedrooms: undefined }), {
      minBedrooms: 0,
    })).toBe(false)
  })

  it('does not reinterpret explicit invalid purpose or null advertised price as legacy defaults', () => {
    const invalidPurpose = { ...property(), listingPurpose: null } as unknown as Property
    expect(matchesSavedSearchCriteria(invalidPurpose, { listingPurpose: 'sale' })).toBe(false)
    expect(matchesSavedSearchCriteria(property({ effectivePrice: null }), { minPrice: 0 })).toBe(false)
    expect(matchesSavedSearchCriteria(property({ listingPurpose: undefined }), { listingPurpose: 'sale' })).toBe(true)
  })

  it('requires every stored structured location field and keeps house/commercial exact', () => {
    const structured = { county: 'Nairobi', constituency: 'Westlands', ward: 'Parklands' }
    expect(matchesSavedSearchCriteria(property({ ward: undefined }), structured)).toBe(false)
    expect(matchesSavedSearchCriteria(property({ county: 'Mombasa' }), structured)).toBe(false)
    expect(matchesSavedSearchCriteria(property({ type: 'house' }), { propertyTypes: ['house'] })).toBe(true)
    expect(matchesSavedSearchCriteria(property({ type: 'Bungalow' }), { propertyTypes: ['house'] })).toBe(false)
    expect(matchesSavedSearchCriteria(property({ type: 'commercial' }), { propertyTypes: ['commercial'] })).toBe(true)
    expect(matchesSavedSearchCriteria(property({ type: 'Office space' }), { propertyTypes: ['commercial'] })).toBe(false)
  })
})
