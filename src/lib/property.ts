import type {
  Property,
  PropertyAvailability,
  PropertyFormValues,
  PropertyPurpose,
  PropertyWritePayload,
} from '@/types/property'

export const PROPERTY_PURPOSES: readonly PropertyPurpose[] = ['sale', 'rent']
export const PROPERTY_AVAILABILITIES: readonly PropertyAvailability[] = ['available', 'sold', 'rented']
export const SALE_PROPERTY_TYPES = ['Apartment', 'Bungalow', 'Townhouse', 'Land', 'Maisonette', 'Office space'] as const
export const RENTAL_PROPERTY_TYPES = ['Apartment', 'Bungalow', 'Townhouse', 'Land'] as const

const isPurpose = (value: unknown): value is PropertyPurpose =>
  value === 'sale' || value === 'rent'

const isAvailability = (value: unknown): value is PropertyAvailability =>
  value === 'available' || value === 'sold' || value === 'rented'

export function isAvailabilityCompatible(
  listingPurpose: PropertyPurpose,
  availability: PropertyFormValues['availability'],
): boolean {
  return availability === 'available' ||
    (listingPurpose === 'sale' && availability === 'sold') ||
    (listingPurpose === 'rent' && availability === 'rented')
}

export function isPropertyTypeAllowed(listingPurpose: PropertyPurpose, type: string): boolean {
  return (listingPurpose === 'rent' ? RENTAL_PROPERTY_TYPES : SALE_PROPERTY_TYPES).some((candidate) => candidate === type)
}

export function createPropertyForm(): PropertyFormValues {
  return {
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
  }
}

function structuredLocation(property: Property): string {
  return [property.ward, property.constituency, property.county]
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(', ')
}

/** Public locations honor the owner's manual value before legacy metadata. */
export function getPropertyLocation(property: Property): string {
  return property.location?.trim() || structuredLocation(property)
}

/** The API projection is authoritative; older responses use the same decimal rule. */
export function getPropertyEffectivePrice(property: Property): number | null {
  if (typeof property.effectivePrice === 'number' && Number.isFinite(property.effectivePrice) && property.effectivePrice >= 0) {
    return property.effectivePrice
  }
  return calculateEffectivePrice(property.price, property.offerPercent ?? 0)
}

export function isPropertyAvailable(property: Property): boolean {
  return property.availability === undefined || property.availability === 'available'
}

function numericText(value: number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? String(value) : '0'
}

export function propertyToForm(property: Property): PropertyFormValues {
  const form: PropertyFormValues = {
    title: property.title ?? '',
    description: property.description ?? '',
    listingPurpose: isPurpose(property.listingPurpose) ? property.listingPurpose : 'sale',
    availability: property.availability === undefined ? 'available'
      : isAvailability(property.availability) ? property.availability : 'invalid',
    price: typeof property.price === 'number' && Number.isFinite(property.price) ? String(property.price) : '',
    offerPercent: typeof property.offerPercent === 'number' && Number.isFinite(property.offerPercent)
      ? String(property.offerPercent)
      : '0',
    location: property.location?.trim() || structuredLocation(property),
    type: property.type ?? 'Apartment',
    bedrooms: numericText(property.bedrooms),
    bathrooms: numericText(property.bathrooms),
    area: numericText(property.area),
    featured: property.featured === true,
    features: [...(property.features ?? [])],
  }

  if (property.county !== undefined) form.county = property.county
  if (property.constituency !== undefined) form.constituency = property.constituency
  if (property.ward !== undefined) form.ward = property.ward
  if (property.coordinates !== undefined) {
    form.coordinates = property.coordinates === null ? null : [...property.coordinates]
  }
  return form
}

function asNumber(text: string): number {
  return text.trim() === '' ? 0 : Number(text)
}

export function buildPropertyPayload(
  form: PropertyFormValues,
  images: string[],
): PropertyWritePayload {
  if (!isAvailability(form.availability)) throw new Error('Choose a valid availability before saving.')
  const payload: PropertyWritePayload = {
    title: form.title.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    listingPurpose: form.listingPurpose,
    availability: form.availability,
    offerPercent: asNumber(form.offerPercent),
    location: form.location.trim(),
    type: form.type,
    bedrooms: form.type === 'Land' ? 0 : asNumber(form.bedrooms),
    bathrooms: form.type === 'Land' ? 0 : asNumber(form.bathrooms),
    area: asNumber(form.area),
    featured: form.featured,
    features: [...form.features],
    images: [...images],
  }

  if (form.county !== undefined) payload.county = form.county
  if (form.constituency !== undefined) payload.constituency = form.constituency
  if (form.ward !== undefined) payload.ward = form.ward
  if (form.coordinates !== undefined) {
    payload.coordinates = form.coordinates === null ? null : [...form.coordinates]
  }
  return payload
}

function parseFiniteNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function offerHasAtMostTwoDecimalPlaces(value: string): boolean {
  const trimmed = value.trim()
  const decimal = /^(?:\d+(?:\.(\d*))?|\.(\d+))$/.exec(trimmed)
  if (!decimal) return false
  const digits = decimal[1] ?? decimal[2] ?? ''
  return digits.length <= 2
}

export function validatePropertyForm(form: PropertyFormValues): string | null {
  if (!form.title.trim()) return 'Title is required.'
  if (!form.description.trim()) return 'Description is required.'
  if (!form.location.trim()) return 'Location is required.'

  const price = parseFiniteNumber(form.price)
  if (price === null || price <= 0) return 'Price must be a finite number greater than zero.'

  const offerPercent = parseFiniteNumber(form.offerPercent)
  if (
    offerPercent === null || offerPercent < 0 || offerPercent > 99.99 ||
    !offerHasAtMostTwoDecimalPlaces(form.offerPercent) ||
    Number(offerPercent.toFixed(2)) !== offerPercent
  ) {
    return 'Offer must be a finite percentage from 0 to 99.99 with at most two decimals.'
  }

  if (!isPurpose(form.listingPurpose)) return 'Choose a valid listing purpose.'
  if (!isAvailability(form.availability)) return 'Choose a valid availability.'
  if (!isAvailabilityCompatible(form.listingPurpose, form.availability)) {
    return `${form.availability} availability is incompatible with ${form.listingPurpose}. Choose a compatible availability.`
  }
  if (!isPropertyTypeAllowed(form.listingPurpose, form.type)) {
    return `${form.type || 'Property type'} is not available for ${form.listingPurpose}. Choose a compatible type.`
  }

  const numericFields = form.type === 'Land'
    ? [['area', form.area]] as const
    : [['bedrooms', form.bedrooms], ['bathrooms', form.bathrooms], ['area', form.area]] as const
  for (const [field, value] of numericFields) {
    const parsed = parseFiniteNumber(value)
    if (parsed === null || parsed < 0) return `${field} must be a finite non-negative number.`
  }
  if (typeof form.featured !== 'boolean') return 'Featured must be selected or cleared.'
  if (!Array.isArray(form.features) || form.features.some((feature) => typeof feature !== 'string')) {
    return 'Features must be a list of names.'
  }
  return null
}

/** Match the backend's decimal-representation, integer-rational half-up pricing rule. */
export function calculateEffectivePrice(price: number, offerPercent = 0): number | null {
  if (
    typeof price !== 'number' || !Number.isFinite(price) || price <= 0 ||
    typeof offerPercent !== 'number' || !Number.isFinite(offerPercent) ||
    offerPercent < 0 || offerPercent > 99.99 || Number(offerPercent.toFixed(2)) !== offerPercent
  ) return null

  const [mantissa, exponent = '0'] = String(price).toLowerCase().split('e')
  const [whole, fraction = ''] = mantissa.split('.')
  const scale = fraction.length - Number(exponent)
  const coefficient = BigInt(whole + fraction)
  const discountBasisPoints = BigInt(Math.round(offerPercent * 100))
  let numerator = coefficient * (10000n - discountBasisPoints)
  let denominator = 100n
  if (scale >= 0) denominator *= 10n ** BigInt(scale)
  else numerator *= 10n ** BigInt(-scale)
  const cents = (numerator + denominator / 2n) / denominator
  return Number(`${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`)
}
