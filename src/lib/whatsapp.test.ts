import { describe, expect, it } from 'vitest'
import { buildPropertyWhatsAppUrl } from './whatsapp'

describe('buildPropertyWhatsAppUrl', () => {
  it('creates an encoded WhatsApp link containing the title and public listing URL', () => {
    const href = buildPropertyWhatsAppUrl(
      { _id: 'listing-123', title: 'Kilimani 2-bed & garden' },
      'https://zawamu.example',
    )

    expect(href).not.toBeNull()
    const url = new URL(href!)
    expect(url.origin).toBe('https://wa.me')
    expect(url.pathname).toBe('/254711168716')
    expect(url.searchParams.get('text')).toBe(
      "Hello, I'm interested in Kilimani 2-bed & garden: https://zawamu.example/listings/listing-123",
    )
    expect(url.searchParams.get('text')).not.toContain('/api/')
  })

  it('requires the canonical API _id rather than falling back to a noncanonical id', () => {
    expect(buildPropertyWhatsAppUrl({ id: 'legacy-id', title: 'Home' } as never, 'https://zawamu.example')).toBeNull()
  })
})
