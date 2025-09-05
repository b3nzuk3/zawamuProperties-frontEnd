import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Square, ArrowRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { ScheduleViewingModal } from '@/components/ui/schedule-viewing-modal'

export default function FeaturedListings() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true)
      try {
        const res = await api.get('/properties')
        setProperties(res.data.filter((p: any) => p.featured))
      } catch (err) {
        setProperties([])
      } finally {
        setLoading(false)
      }
    }
    fetchProperties()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Featured Properties
          </div>
          <h2 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Discover Exceptional Properties
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked premium properties that represent the finest in luxury
            living
          </p>
        </div>
        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {properties.map((property: any, index: number) => (
              <Card
                key={property._id || property.id}
                className={`property-card group overflow-hidden ${
                  index === 0 ? 'listing-fade-in' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={
                      property.images?.[0] ||
                      property.image ||
                      '/placeholder.jpg'
                    }
                    alt={property.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge
                      variant="secondary"
                      className="bg-accent text-accent-foreground"
                    >
                      Featured
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="outline"
                      className="bg-background/90 backdrop-blur-sm"
                    >
                      {property.type}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-heading font-semibold text-xl text-foreground mb-2 group-hover:text-accent transition-colors">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{property.location}</span>
                    </div>
                    <div className="font-heading font-bold text-2xl text-accent">
                      {formatPrice(property.price)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      <span>{property.bedrooms} Bed</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      <span>{property.bathrooms} Bath</span>
                    </div>
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      <span>{property.area?.toLocaleString()} sqft</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Link to={`/listings/${property._id || property.id}`}>
                      <Button
                        variant="outline"
                        className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <ScheduleViewingModal
                      propertyId={property._id || property.id}
                      propertyTitle={property.title}
                    >
                      <Button
                        variant="secondary"
                        className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Viewing
                      </Button>
                    </ScheduleViewingModal>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* View All Button */}
        <div className="text-center">
          <Link to="/listings">
            <Button size="lg">
              View All Properties
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
