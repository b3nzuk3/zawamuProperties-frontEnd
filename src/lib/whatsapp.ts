import { COMPANY_WHATSAPP_DESTINATION } from './companyContact'

type WhatsAppListing = {
  _id?: string
  title: string
}

/** Builds a WhatsApp deep link to the public listing, never an API resource URL. */
export function buildPropertyWhatsAppUrl(property: WhatsAppListing, origin: string): string | null {
  const id = property._id?.trim()
  if (!id) return null

  const publicOrigin = new URL(origin).origin
  const listingUrl = new URL(`/listings/${encodeURIComponent(id)}`, publicOrigin).toString()
  const message = `Hello, I'm interested in ${property.title}: ${listingUrl}`
  return `https://wa.me/${COMPANY_WHATSAPP_DESTINATION}?text=${encodeURIComponent(message)}`
}
