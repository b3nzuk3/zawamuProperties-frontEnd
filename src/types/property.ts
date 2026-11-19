export type PropertyPurpose = 'sale' | 'rent'
export type PropertyAvailability = 'available' | 'sold' | 'rented'
export type PropertyCoordinates = [longitude: number, latitude: number] | null

/** Editable form state keeps numeric inputs as text while the user is typing. */
export interface PropertyFormValues {
  title: string
  description: string
  listingPurpose: PropertyPurpose
  /** Historical invalid values require explicit correction, never reactivation. */
  availability: PropertyAvailability | 'invalid'
  price: string
  offerPercent: string
  location: string
  type: string
  bedrooms: string
  bathrooms: string
  area: string
  featured: boolean
  features: string[]
  /** Retained only when an older property already has structured location data. */
  county?: string
  constituency?: string
  ward?: string
  coordinates?: PropertyCoordinates
}

/** API property projection, including read-time compatibility fields. */
export interface Property {
  _id?: string
  title: string
  description: string
  price: number
  location: string
  type: string
  images?: string[]
  features?: string[]
  listingPurpose?: PropertyPurpose
  availability?: PropertyAvailability
  offerPercent?: number
  effectivePrice?: number | null
  featured?: boolean
  bedrooms?: number
  bathrooms?: number
  area?: number
  county?: string
  constituency?: string
  ward?: string
  coordinates?: PropertyCoordinates
}

/** Explicit allowlisted fields accepted by the property write API. */
export interface PropertyWritePayload {
  title: string
  description: string
  price: number
  listingPurpose: PropertyPurpose
  availability: PropertyAvailability
  offerPercent: number
  location: string
  type: string
  bedrooms: number
  bathrooms: number
  area: number
  featured: boolean
  features: string[]
  images: string[]
  county?: string
  constituency?: string
  ward?: string
  coordinates?: PropertyCoordinates
}
