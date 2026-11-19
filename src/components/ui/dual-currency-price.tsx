import React from 'react'
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter'
import { Badge } from './badge'
import { RefreshCw } from 'lucide-react'

interface DualCurrencyPriceProps {
  price: number
  originalCurrency: 'USD' | 'KES'
  className?: string
  showRefresh?: boolean
}

function formatKesAmount(amount: number): string {
  const hasFractionalCents = !Number.isInteger(amount)
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: hasFractionalCents ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `KSh ${formatted}`
}

function formatUsdAmount(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function DualCurrencyPrice({
  price,
  originalCurrency,
  className = '',
  showRefresh = false,
}: DualCurrencyPriceProps) {
  const {
    usdToKes,
    kesToUsd,
    loading,
    error,
    refreshRates,
  } = useCurrencyConverter()

  const usdPrice = originalCurrency === 'USD' ? price : kesToUsd(price)
  const kesPrice = originalCurrency === 'KES' ? price : usdToKes(price)

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Primary Currency (Original) */}
      <div className="font-heading font-bold text-2xl lg:text-3xl text-accent">
        {originalCurrency === 'USD' ? formatUsdAmount(usdPrice) : formatKesAmount(kesPrice)}
      </div>

      {/* Secondary Currency (Converted) */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          ≈{' '}
          {originalCurrency === 'USD'
            ? formatKesAmount(kesPrice)
            : formatUsdAmount(usdPrice)}
        </div>
        {showRefresh && (
          <button
            onClick={refreshRates}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh exchange rates"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Error Badge */}
      {error && (
        <Badge variant="outline" className="text-xs text-amber-600">
          Using approximate rates
        </Badge>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="text-xs text-muted-foreground">Updating rates...</div>
      )}
    </div>
  )
}
