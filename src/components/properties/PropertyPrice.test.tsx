import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Property } from '@/types/property'
import { PropertyPrice } from './PropertyPrice'

// Explicit conversion fixture: this test does not contact a currency provider.
vi.mock('@/hooks/useCurrencyConverter', () => ({
  useCurrencyConverter: () => ({
    kesToUsd: (amount: number) => amount / 150,
    usdToKes: (amount: number) => amount * 150,
    formatKes: (amount: number) => `KSh ${Math.round(amount).toLocaleString('en-US')}`,
    formatUsd: (amount: number) => `$${Math.round(amount).toLocaleString('en-US')}`,
    loading: false,
    error: '',
    refreshRates: vi.fn(),
  }),
}))

const property = (overrides: Partial<Property> = {}): Property => ({
  _id: 'property-123',
  title: 'Kilimani apartment',
  description: 'Bright apartment',
  price: 100_000,
  location: 'Kilimani',
  type: 'Apartment',
  ...overrides,
})

describe('PropertyPrice', () => {
  it('uses authoritative effective price, preserves cents, and strikes the original only for a discount', () => {
    render(<PropertyPrice property={property({ price: 100_000, offerPercent: 10, effectivePrice: 91_234.56 })} />)

    expect(screen.getByText('KSh 91,234.56')).toBeInTheDocument()
    expect(screen.getByText('≈ $608.23')).toBeInTheDocument()
    expect(screen.getByText('KSh 100,000').closest('del')).toBeInTheDocument()
  })

  it('calculates a discounted legacy effective price and preserves the calculated cents', () => {
    render(<PropertyPrice property={property({ price: 1_000.05, offerPercent: 10 })} />)

    expect(screen.getByText('KSh 900.05')).toBeInTheDocument()
    expect(screen.getByText('≈ $6.00')).toBeInTheDocument()
    expect(screen.getByText('KSh 1,000.05').closest('del')).toBeInTheDocument()
  })

  it('calculates a legacy effective price and adds a monthly suffix for rent without a strikethrough when undiscounted', () => {
    render(<PropertyPrice property={property({ listingPurpose: 'rent', price: 100_000.01, offerPercent: 0 })} />)

    expect(screen.getByText('KSh 100,000.01')).toBeInTheDocument()
    expect(screen.getByText('/ month')).toBeInTheDocument()
    expect(screen.queryByText('KSh 100,000.01')?.closest('del')).toBeNull()
  })

  it('does not invent a strikethrough for a non-discounted listing', () => {
    render(<PropertyPrice property={property({ price: 100_000, offerPercent: 0, effectivePrice: 100_000 })} />)

    expect(screen.queryByText('KSh 100,000')?.closest('del')).toBeNull()
  })
})
