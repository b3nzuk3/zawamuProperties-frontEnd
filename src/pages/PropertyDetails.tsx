import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Bed, Bath, Square, ArrowLeft, Calendar, Phone } from 'lucide-react'
import api from '@/lib/api'
import { ScheduleViewingModal } from '@/components/ui/schedule-viewing-modal'
import { PropertyPrice } from '@/components/properties/PropertyPrice'
import { PropertyBadges } from '@/components/properties/PropertyBadges'
import { WhatsAppButton } from '@/components/properties/WhatsAppButton'
import EnquiryForm from '@/components/contact/EnquiryForm'
import { getPropertyLocation, isPropertyAvailable } from '@/lib/property'
import type { Property } from '@/types/property'

export default function PropertyDetails() {
  const { id } = useParams()
  const [propertyResult, setPropertyResult] = useState<{ id: string; property?: Property; error?: string } | null>(null)
  const currentResult = propertyResult?.id === id ? propertyResult : null
  const property = currentResult?.property ?? null
  const error = currentResult?.error ?? null
  const loading = Boolean(id && !currentResult)

  useEffect(() => {
    if (!id) {
      setPropertyResult(null)
      return
    }

    let active = true
    setPropertyResult(null)
    async function fetchProperty() {
      try {
        const res = await api.get(`/properties/${id}`)
        if (active) setPropertyResult({ id, property: res.data })
      } catch {
        if (active) setPropertyResult({ id, error: 'Failed to load property details.' })
      }
    }
    void fetchProperty()

    return () => { active = false }
  }, [id])

  const mainImage = useMemo(() => {
    if (!property?.images || property.images.length === 0)
      return '/placeholder.jpg'
    return property.images[0]
  }, [property])

  if (loading)
    return (
      <Layout>
        <div className="py-24 text-center text-lg">Loading property...</div>
      </Layout>
    )

  if (error)
    return (
      <Layout>
        <div className="py-24 text-center text-red-500">{error}</div>
      </Layout>
    )

  if (!property)
    return (
      <Layout>
        <div className="py-24 text-center text-lg">Property not found.</div>
      </Layout>
    )

  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <Link to="/listings">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Listings
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <img
                src={mainImage}
                alt={property.title}
                className="w-full h-96 object-cover rounded-xl"
              />
              {property.images && property.images.length > 1 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {property.images.slice(1, 7).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${property.title} ${idx + 2}`}
                      className="h-24 w-full object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-heading font-semibold text-xl mb-3">
                    Description
                  </h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {property.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="font-heading font-bold text-2xl mb-1">
                        {property.title}
                      </h1>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{getPropertyLocation(property)}</span>
                      </div>
                    </div>
                  </div>
                  <PropertyBadges property={property} />

                  <PropertyPrice property={property} showRefresh className="mb-4" />

                  {isPropertyAvailable(property) ? (
                    <ScheduleViewingModal
                      propertyId={property._id ?? ''}
                      propertyTitle={property.title}
                    >
                      <Button className="w-full mb-3">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule a Viewing
                      </Button>
                    </ScheduleViewingModal>
                  ) : (
                    <Button className="w-full mb-3" disabled aria-label="Viewing unavailable">
                      <Calendar className="h-4 w-4 mr-2" />
                      Viewing unavailable
                    </Button>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" className="w-full flex-1" asChild>
                      <Link to="/contact" aria-label="Contact us">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact us
                      </Link>
                    </Button>
                    <WhatsAppButton property={property} className="flex-1" />
                  </div>

                  <div className={`grid ${property.type === 'Land' ? 'grid-cols-1' : 'grid-cols-3'} gap-3 text-sm text-muted-foreground`}>
                    {property.type !== 'Land' && (
                      <>
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" /> {property.bedrooms ?? 0}{' '}
                          Bed
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />{' '}
                          {property.bathrooms ?? 0} Bath
                        </div>
                      </>
                    )}
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      {(property.area ?? 0).toLocaleString()} sqft
                    </div>
                  </div>
                </CardContent>
              </Card>

              {property._id && (
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <div>
                      <h2 className="font-heading text-xl font-semibold">Ask about this property</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Send a message about {property.title}. Enquiries are available even when a listing is sold or rented.</p>
                    </div>
                    <EnquiryForm key={property._id} source="property" propertyId={property._id} propertyTitle={property.title} />
                  </CardContent>
                </Card>
              )}

              {property.features && property.features.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-heading font-semibold text-lg mb-3">
                      Features
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((f, i) => (
                        <Badge key={i} variant="secondary">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
