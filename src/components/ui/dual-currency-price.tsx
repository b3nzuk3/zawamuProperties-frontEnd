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

export function DualCurrencyPrice({
  price,
  originalCurrency,
  className = '',
  showRefresh = false,
}: DualCurrencyPriceProps) {
  const {
    usdToKes,
    kesToUsd,
    formatUsd,
    formatKes,
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
        {originalCurrency === 'USD' ? formatUsd(usdPrice) : formatKes(kesPrice)}
      </div>

      {/* Secondary Currency (Converted) */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          ≈{' '}
          {originalCurrency === 'USD'
            ? formatKes(kesPrice)
            : formatUsd(usdPrice)}
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
