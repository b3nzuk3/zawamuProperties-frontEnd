import { Link } from 'react-router-dom'
import { ArrowRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScheduleViewingModal } from '@/components/ui/schedule-viewing-modal'
import { WhatsAppButton } from './WhatsAppButton'
import { isPropertyAvailable } from '@/lib/property'
import type { Property } from '@/types/property'

interface PropertyCardActionsProps {
  property: Property
  detailsVariant?: 'default' | 'outline'
}

export function PropertyCardActions({ property, detailsVariant = 'default' }: PropertyCardActionsProps) {
  return (
    <div className="space-y-2">
      <Button asChild variant={detailsVariant} className="w-full min-h-11 after:absolute after:inset-0 after:z-10 after:rounded-xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset">
        <Link to={`/listings/${property._id}`} aria-label={`View Details: ${property.title}`}>
          View Details
          <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      {/* Above the stretched details link, so contact actions never navigate the card. */}
      <div className="relative z-20 grid grid-cols-2 gap-2">
        <WhatsAppButton property={property} iconOnly className="w-full min-h-11" />
        {isPropertyAvailable(property) ? (
          <ScheduleViewingModal propertyId={property._id || ''} propertyTitle={property.title}>
            <Button variant="secondary" className="w-full min-h-11" aria-label="Schedule Viewing" title="Schedule Viewing">
              <Calendar aria-hidden="true" className="h-5 w-5" />
            </Button>
          </ScheduleViewingModal>
        ) : (
          <Button variant="secondary" className="w-full min-h-11" disabled aria-label="Viewing unavailable" title="Viewing unavailable">
            <Calendar aria-hidden="true" className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
