import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Bed, Bath, Square, ArrowLeft, Calendar } from 'lucide-react'
import api from '@/lib/api'
import { ScheduleViewingModal } from '@/components/ui/schedule-viewing-modal'
import { DualCurrencyPrice } from '@/components/ui/dual-currency-price'

type Property = {
  _id?: string
  id?: string
  title: string
  description: string
  price: number
  location: string
  type?: string
  featured?: boolean
  images?: string[]
  features?: string[]
  bedrooms?: number
  bathrooms?: number
  area?: number
}

export default function PropertyDetails() {
  const { id } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperty() {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get(`/properties/${id}`)
        setProperty(res.data)
      } catch (err) {
        setError('Failed to load property details.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchProperty()
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
                        <span>{property.location}</span>
                      </div>
                    </div>
                    {property.featured && (
                      <Badge className="bg-accent text-accent-foreground">
                        Featured
                      </Badge>
                    )}
                  </div>

                  <DualCurrencyPrice
                    price={property.price}
                    originalCurrency="KES"
                    showRefresh={true}
                    className="mb-4"
                  />

                  <ScheduleViewingModal
                    propertyId={property._id || property.id || ''}
                    propertyTitle={property.title}
                  >
                    <Button className="w-full mb-4">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule a Viewing
                    </Button>
                  </ScheduleViewingModal>

                  <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" /> {property.bedrooms ?? 0}{' '}
                      Bed
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />{' '}
                      {property.bathrooms ?? 0} Bath
                    </div>
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      {(property.area ?? 0).toLocaleString()} sqft
                    </div>
                  </div>
                </CardContent>
              </Card>

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
