import type { Property, PropertyPurpose } from '@/types/property'
import { getPropertyEffectivePrice, getPropertyLocation } from './property'

export interface SavedSearchCriteria {
  location?: string
  listingPurpose?: PropertyPurpose
  county?: string
  constituency?: string
  ward?: string
  propertyTypes?: string[]
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  maxBedrooms?: number
  minBathrooms?: number
  maxBathrooms?: number
  searchTerm?: string
}

export interface SavedSearchCriteriaValidation {
  valid: boolean
  criteria: SavedSearchCriteria | null
  error: string | null
}

const textFields = ['location', 'county', 'constituency', 'ward', 'searchTerm'] as const
const numericFields = [
  'minPrice',
  'maxPrice',
  'minBedrooms',
  'maxBedrooms',
  'minBathrooms',
  'maxBathrooms',
] as const
const criteriaFields = new Set<string>([
  ...textFields,
  'listingPurpose',
  'propertyTypes',
  ...numericFields,
])
const allowedPropertyTypes = new Set([
  'Apartment',
  'Bungalow',
  'Townhouse',
  'Land',
  'Maisonette',
  'Office space',
  // Exact historical aliases; house/commercial remain literal types.
  'apartment',
  'land',
  'office',
  'house',
  'commercial',
])
const legacyPropertyTypeAliases: Record<string, string> = {
  apartment: 'Apartment',
  land: 'Land',
  office: 'Office space',
}

export function normalizeSavedSearchPropertyType(type: string): string {
  return legacyPropertyTypeAliases[type] ?? type
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 0x1f || code === 0x7f
  })
}

function invalid(error: string): SavedSearchCriteriaValidation {
  return { valid: false, criteria: null, error }
}

export function validateSavedSearchCriteria(value: unknown): SavedSearchCriteriaValidation {
  if (!isRecord(value)) return invalid('Saved search criteria must be an object.')

  const unsupportedFields = Object.keys(value).filter((field) => !criteriaFields.has(field))
  if (unsupportedFields.length > 0) {
    return invalid(`Unsupported saved search field${unsupportedFields.length === 1 ? '' : 's'}: ${unsupportedFields.join(', ')}.`)
  }

  const criteria: SavedSearchCriteria = {}
  for (const field of textFields) {
    const candidate = value[field]
    if (candidate === undefined) continue
    if (typeof candidate !== 'string') return invalid(`Saved search ${field} must be text.`)
    const normalized = candidate.trim()
    if (normalized.length > 200 || containsControlCharacter(normalized)) {
      return invalid(`Saved search ${field} is invalid or too long.`)
    }
    if (!normalized) continue
    // Older saves used "all" as a county selector's no-filter sentinel.
    if (field === 'county' && normalized.toLowerCase() === 'all') continue
    criteria[field] = normalized
  }

  if (value.listingPurpose !== undefined) {
    if (value.listingPurpose !== 'sale' && value.listingPurpose !== 'rent') {
      return invalid('Saved search listing purpose must be sale or rent.')
    }
    criteria.listingPurpose = value.listingPurpose
  }

  if (value.propertyTypes !== undefined) {
    if (!Array.isArray(value.propertyTypes)) {
      return invalid('Saved search property types must be a list.')
    }
    const invalidTypeIndex = value.propertyTypes.findIndex(
      (type) => typeof type !== 'string' || !allowedPropertyTypes.has(type),
    )
    if (invalidTypeIndex !== -1) {
      return invalid(`Unsupported saved search property type: ${String(value.propertyTypes[invalidTypeIndex])}.`)
    }
    if (value.propertyTypes.length > 0) {
      criteria.propertyTypes = (value.propertyTypes as string[]).map(normalizeSavedSearchPropertyType)
    }
  }

  for (const field of numericFields) {
    const candidate = value[field]
    if (candidate === undefined) continue
    if (typeof candidate !== 'number' || !Number.isFinite(candidate) || candidate < 0) {
      return invalid(`Saved search ${field} must be a finite, non-negative number.`)
    }
    criteria[field] = candidate
  }

  const ranges = [
    ['minPrice', 'maxPrice'],
    ['minBedrooms', 'maxBedrooms'],
    ['minBathrooms', 'maxBathrooms'],
  ] as const
  for (const [minimum, maximum] of ranges) {
    if (criteria[minimum] !== undefined && criteria[maximum] !== undefined && criteria[minimum]! > criteria[maximum]!) {
      return invalid(`Saved search ${minimum} cannot exceed ${maximum}.`)
    }
  }

  return { valid: true, criteria, error: null }
}

export function parseSavedSearchCriteria(
  serialized: string | null | undefined,
): SavedSearchCriteriaValidation {
  if (serialized === null || serialized === undefined) {
    return { valid: true, criteria: {}, error: null }
  }
  try {
    return validateSavedSearchCriteria(JSON.parse(serialized) as unknown)
  } catch {
    return invalid('Saved search criteria could not be parsed.')
  }
}

function formatPrice(value: number): string {
  return `KSh ${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

function formatPriceRange(minimum: number | undefined, maximum: number | undefined): string {
  const min = minimum !== undefined ? formatPrice(minimum) : 'Any'
  const max = maximum !== undefined ? formatPrice(maximum) : 'Any'
  return `${min} - ${max}`
}

function formatCountRange(minimum: number | undefined, maximum: number | undefined): string {
  const min = minimum !== undefined ? String(minimum) : 'Any'
  const max = maximum !== undefined ? String(maximum) : 'Any'
  return `${min} - ${max}`
}

export function summarizeSavedSearchCriteria(criteria: SavedSearchCriteria): string {
  const parts: string[] = []

  if (criteria.location) parts.push(`Location: ${criteria.location}`)

  const structuredLocation = [criteria.ward, criteria.constituency, criteria.county]
    .filter((value): value is string => Boolean(value))
    .join(', ')
  if (structuredLocation) parts.push(`Structured area: ${structuredLocation}`)

  if (criteria.listingPurpose) {
    parts.push(criteria.listingPurpose === 'rent' ? 'For Rent' : 'For Sale')
  }

  if (criteria.propertyTypes?.length) {
    const types = criteria.propertyTypes.map((type) =>
      type === 'house' || type === 'commercial' ? `${type} (exact legacy type)` : type,
    )
    parts.push(`Property type: ${types.join(', ')}`)
  }

  if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
    const priceLabel = criteria.listingPurpose === 'rent'
      ? 'Effective monthly rent'
      : criteria.listingPurpose === 'sale' ? 'Effective sale price' : 'Effective price'
    const suffix = criteria.listingPurpose === 'rent' ? ' / month' : ''
    parts.push(`${priceLabel}: ${formatPriceRange(criteria.minPrice, criteria.maxPrice)}${suffix}`)
  }

  if (criteria.minBedrooms !== undefined || criteria.maxBedrooms !== undefined) {
    parts.push(`Bedrooms: ${formatCountRange(criteria.minBedrooms, criteria.maxBedrooms)}`)
  }

  if (criteria.minBathrooms !== undefined || criteria.maxBathrooms !== undefined) {
    parts.push(`Bathrooms: ${formatCountRange(criteria.minBathrooms, criteria.maxBathrooms)}`)
  }

  if (criteria.searchTerm) parts.push(`Search: "${criteria.searchTerm}"`)

  return parts.length > 0 ? parts.join(' • ') : 'All properties'
}

function matchesStructuredLocation(
  candidate: string | undefined,
  expected: string | undefined,
): boolean {
  if (expected === undefined) return true
  return typeof candidate === 'string' && candidate.trim().toLowerCase() === expected.toLowerCase()
}

function matchesNumericBounds(
  candidate: number | undefined,
  minimum: number | undefined,
  maximum: number | undefined,
): boolean {
  if (minimum === undefined && maximum === undefined) return true
  if (typeof candidate !== 'number' || !Number.isFinite(candidate)) return false
  if (minimum !== undefined && candidate < minimum) return false
  if (maximum !== undefined && candidate > maximum) return false
  return true
}

export function matchesSavedSearchCriteria(property: Property, criteriaValue: unknown): boolean {
  const validation = validateSavedSearchCriteria(criteriaValue)
  if (!validation.valid || validation.criteria === null) return false
  const criteria = validation.criteria

  if (criteria.location && !getPropertyLocation(property).toLowerCase().includes(criteria.location.toLowerCase())) {
    return false
  }

  const listingPurpose = property.listingPurpose === undefined ? 'sale' : property.listingPurpose
  if (criteria.listingPurpose && listingPurpose !== criteria.listingPurpose) {
    return false
  }

  if (criteria.propertyTypes?.length) {
    const propertyType = normalizeSavedSearchPropertyType(property.type)
    if (!criteria.propertyTypes.some((type) => normalizeSavedSearchPropertyType(type) === propertyType)) {
      return false
    }
  }

  if (!matchesStructuredLocation(property.county, criteria.county)) return false
  if (!matchesStructuredLocation(property.constituency, criteria.constituency)) return false
  if (!matchesStructuredLocation(property.ward, criteria.ward)) return false

  if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
    const effectivePrice = getPropertyEffectivePrice(property)
    if (effectivePrice === null || !matchesNumericBounds(effectivePrice, criteria.minPrice, criteria.maxPrice)) {
      return false
    }
  }

  if (!matchesNumericBounds(property.bedrooms, criteria.minBedrooms, criteria.maxBedrooms)) return false
  if (!matchesNumericBounds(property.bathrooms, criteria.minBathrooms, criteria.maxBathrooms)) return false

  if (criteria.searchTerm) {
    const searchableText = [property.title, property.description, getPropertyLocation(property)]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toLowerCase()
    if (!searchableText.includes(criteria.searchTerm.toLowerCase())) return false
  }

  return true
}
