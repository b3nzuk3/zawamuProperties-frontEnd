import { describe, expect, it } from 'vitest'
import { COMPANY_WHATSAPP_DESTINATION, COMPANY_WHATSAPP_PHONE } from './companyContact'

describe('company WhatsApp contact', () => {
  it('keeps the configured company phone and a wa.me-compatible destination', () => {
    expect(COMPANY_WHATSAPP_PHONE).toBe('+254711168716')
    expect(COMPANY_WHATSAPP_DESTINATION).toBe('254711168716')
  })
})
