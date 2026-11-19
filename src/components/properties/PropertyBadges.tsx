import type { Property } from '@/types/property'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PropertyBadgesProps {
  property: Property
  className?: string
}

export function PropertyBadges({ property, className }: PropertyBadgesProps) {
  const purposeLabel = property.listingPurpose === 'sale'
    ? 'For Sale'
    : property.listingPurpose === 'rent'
      ? 'For Rent'
      : null
  const offerPercent = property.offerPercent
  const hasOffer = typeof offerPercent === 'number' && Number.isFinite(offerPercent) && offerPercent > 0
  const availability = property.availability === undefined ? 'available' : property.availability
  const availabilityLabel = availability === 'sold'
    ? 'Sold'
    : availability === 'rented'
      ? 'Rented'
      : availability === 'available' ? 'Available' : 'Unavailable'

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} aria-label="Property details">
      {purposeLabel && <Badge variant="outline" className="whitespace-normal">{purposeLabel}</Badge>}
      {property.featured === true && (
        <Badge className="whitespace-normal bg-accent text-accent-foreground">Featured</Badge>
      )}
      {hasOffer && <Badge variant="secondary" className="whitespace-normal">{offerPercent}% off</Badge>}
      <Badge
        variant="outline"
        className={cn(
          'whitespace-normal',
          availability === 'available' && 'border-emerald-600/40 text-emerald-700 dark:text-emerald-300',
          availability === 'sold' && 'border-rose-600/40 text-rose-700 dark:text-rose-300',
          availability === 'rented' && 'border-amber-600/40 text-amber-700 dark:text-amber-300',
        )}
      >
        {availabilityLabel}
      </Badge>
    </div>
  )
}
