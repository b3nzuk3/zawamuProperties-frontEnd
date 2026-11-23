import type { Property } from '@/types/property'
import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PropertyBadgesProps {
  property: Property
  className?: string
  showFeatured?: boolean
}

export function PropertyFeaturedBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn('gap-1 border-transparent bg-amber-100 px-3 py-1 text-amber-950 hover:bg-amber-100', className)}>
      <Star aria-hidden="true" className="h-3 w-3 fill-current" />
      Featured
    </Badge>
  )
}

export function PropertyBadges({ property, className, showFeatured = true }: PropertyBadgesProps) {
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
      {purposeLabel && <Badge className="border-transparent bg-slate-900 px-3 py-1 text-white hover:bg-slate-900">{purposeLabel}</Badge>}
      <Badge
        variant="outline"
        className={cn(
          'border-transparent bg-slate-100 px-3 py-1 text-slate-900',
          availability === 'available' && 'bg-emerald-700 text-white',
          availability === 'sold' && 'bg-rose-700 text-white',
          availability === 'rented' && 'bg-amber-100 text-amber-950',
        )}
      >
        {availabilityLabel}
      </Badge>
      {hasOffer && <Badge variant="secondary" className="bg-white px-3 py-1 text-slate-900">{offerPercent}% off</Badge>}
      {showFeatured && property.featured === true && <PropertyFeaturedBadge />}
    </div>
  )
}
