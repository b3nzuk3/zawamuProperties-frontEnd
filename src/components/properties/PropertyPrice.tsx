import type { Property } from '@/types/property'
import { DualCurrencyPrice } from '@/components/ui/dual-currency-price'
import { getPropertyEffectivePrice } from '@/lib/property'
import { cn } from '@/lib/utils'

function formatKesAmount(amount: number): string {
  return `KSh ${amount.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

interface PropertyPriceProps {
  property: Property
  className?: string
  showRefresh?: boolean
}

export function PropertyPrice({ property, className, showRefresh = false }: PropertyPriceProps) {
  const effectivePrice = getPropertyEffectivePrice(property)
  if (effectivePrice === null) {
    return <p className={cn('text-sm text-muted-foreground', className)}>Price unavailable</p>
  }

  const discounted = effectivePrice < property.price

  return (
    <div className={cn('space-y-1', className)}>
      {discounted && (
        <del className="text-sm text-muted-foreground" aria-label="Original price">
          {formatKesAmount(property.price)}
        </del>
      )}
      <div className="flex flex-wrap items-baseline gap-x-1">
        <DualCurrencyPrice
          price={effectivePrice}
          originalCurrency="KES"
          showRefresh={showRefresh}
          className="mb-0"
        />
        {property.listingPurpose === 'rent' && (
          <span className="text-sm text-muted-foreground">/ month</span>
        )}
      </div>
    </div>
  )
}
