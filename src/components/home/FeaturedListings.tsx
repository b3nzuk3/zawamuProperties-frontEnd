import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Square, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { PropertyBadges, PropertyFeaturedBadge } from '@/components/properties/PropertyBadges'
import { PropertyPrice } from '@/components/properties/PropertyPrice'
import { PropertyCardActions } from '@/components/properties/PropertyCardActions'
import { getPropertyLocation } from '@/lib/property'
import type { Property } from '@/types/property'

type FeaturedProperty = Property & { id?: string; image?: string }

export default function FeaturedListings() {
  const [properties, setProperties] = useState<FeaturedProperty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true)
      try {
        const res = await api.get('/properties')
        const loadedProperties = res.data as FeaturedProperty[]
        setProperties(loadedProperties.filter((property) => property.featured))
      } catch (err) {
        setProperties([])
      } finally {
        setLoading(false)
      }
    }
    fetchProperties()
  }, [])

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
            {properties.map((property, index) => (
              <Card
                key={property._id || property.id}
                data-testid="property-card"
                className={`property-card group relative isolate overflow-hidden ${
                  index === 0 ? 'listing-fade-in' : ''
                }`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={
                      property.images?.[0] || property.image || '/placeholder.jpg'
                    }
                    alt={property.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <PropertyBadges property={property} showFeatured={false} className="absolute top-4 left-4 right-4" />
                  <PropertyFeaturedBadge className="absolute bottom-4 left-4" />
                  <div className="absolute bottom-4 right-4 max-w-[45%]">
                    <Badge variant="outline" className="bg-white text-slate-900">
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
                      <span className="text-sm">{getPropertyLocation(property)}</span>
                    </div>
                    <PropertyPrice property={property} className="mb-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                    {property.type !== 'Land' && (
                      <>
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          <span>{property.bedrooms ?? 0} Bed</span>
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />
                          <span>{property.bathrooms ?? 0} Bath</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      <span>{property.area?.toLocaleString()} sqft</span>
                    </div>
                  </div>
                  <PropertyCardActions property={{ ...property, _id: property._id || property.id }} detailsVariant="outline" />
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
