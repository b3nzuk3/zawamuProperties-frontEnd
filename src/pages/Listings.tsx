import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import {
  Search,
  Filter,
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Grid,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { ScheduleViewingModal } from '@/components/ui/schedule-viewing-modal'
import { LocationSelector } from '@/components/ui/location-selector'
import { SaveSearchModal } from '@/components/ui/save-search-modal'

export default function Listings() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState({
    county: 'all',
    constituency: '',
    ward: '',
  })
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 20000000])
  const [minBedrooms, setMinBedrooms] = useState('any')
  const [minBathrooms, setMinBathrooms] = useState('any')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false)

  useEffect(() => {
    api
      .get('/properties')
      .then((res) => setProperties(res.data))
      .catch((err) => setError('Failed to load properties'))
      .finally(() => setLoading(false))
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Filter properties based on search criteria
  const filteredProperties = properties.filter((property) => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const locationText =
        property.ward && property.constituency && property.county
          ? `${property.ward}, ${property.constituency}, ${property.county}`.toLowerCase()
          : property.location.toLowerCase()

      const matchesSearch =
        property.title.toLowerCase().includes(searchLower) ||
        locationText.includes(searchLower) ||
        property.description.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Location filter - check county, constituency, or ward
    if (selectedLocation.county && selectedLocation.county !== 'all') {
      let matchesLocation = false

      // If ward is selected, match by ward
      if (selectedLocation.ward && property.ward) {
        matchesLocation =
          property.ward.toLowerCase() === selectedLocation.ward.toLowerCase()
      }
      // If constituency is selected (but no ward), match by constituency
      else if (selectedLocation.constituency && property.constituency) {
        matchesLocation =
          property.constituency.toLowerCase() ===
          selectedLocation.constituency.toLowerCase()
      }
      // If only county is selected, match by county
      else if (selectedLocation.county && property.county) {
        matchesLocation =
          property.county.toLowerCase() ===
          selectedLocation.county.toLowerCase()
      }

      if (!matchesLocation) return false
    }

    // Property type filter
    if (selectedTypes.length > 0) {
      if (!selectedTypes.includes(property.type)) {
        return false
      }
    }

    // Price range filter
    if (property.price < priceRange[0] || property.price > priceRange[1]) {
      return false
    }

    // Bedrooms filter
    if (minBedrooms !== 'any') {
      const minBeds = parseInt(minBedrooms)
      if (property.bedrooms < minBeds) {
        return false
      }
    }

    // Bathrooms filter
    if (minBathrooms !== 'any') {
      const minBaths = parseInt(minBathrooms)
      if (property.bathrooms < minBaths) {
        return false
      }
    }

    return true
  })

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type])
    } else {
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    }
  }

  const handleLocationChange = (location: {
    county: string
    constituency: string
    ward: string
    coordinates?: [number, number]
  }) => {
    setSelectedLocation({
      county: location.county,
      constituency: location.constituency,
      ward: location.ward,
    })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedLocation({ county: 'all', constituency: '', ward: '' })
    setSelectedTypes([])
    setPriceRange([0, 20000000])
    setMinBedrooms('any')
    setMinBathrooms('any')
  }

  const getCurrentSearchCriteria = () => {
    return {
      county:
        selectedLocation.county !== 'all' ? selectedLocation.county : undefined,
      constituency: selectedLocation.constituency || undefined,
      ward: selectedLocation.ward || undefined,
      propertyTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 20000000 ? priceRange[1] : undefined,
      minBedrooms: minBedrooms !== 'any' ? parseInt(minBedrooms) : undefined,
      maxBedrooms: undefined, // We only have min bedrooms filter
      minBathrooms: minBathrooms !== 'any' ? parseInt(minBathrooms) : undefined,
      maxBathrooms: undefined, // We only have min bathrooms filter
      searchTerm: searchTerm || undefined,
    }
  }

  const hasActiveFilters = () => {
    const criteria = getCurrentSearchCriteria()
    return Object.values(criteria).some((value) => value !== undefined)
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">Loading properties...</div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12 text-red-500">{error}</div>
          </div>
        </div>
      </Layout>
    )
  }

  // Restore the full search, filter, and property grid UI
  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-4">
              Property Listings
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover your perfect property from our extensive collection
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-card">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by property name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Location - will be moved to filters section */}

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>

              {/* View Mode */}
              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="flex flex-col gap-6 mt-4">
                {/* Location Filter */}
                <div>
                  <LocationSelector
                    onLocationChange={handleLocationChange}
                    initialLocation={selectedLocation}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  {/* Property Type */}
                  <div className="w-full md:w-48">
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Property Type
                    </label>
                    <div className="space-y-2">
                      {['House', 'Condo', 'Loft', 'Commercial', 'Land'].map(
                        (type) => (
                          <div
                            key={type}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={type}
                              checked={selectedTypes.includes(type)}
                              onCheckedChange={(checked) =>
                                handleTypeChange(type, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={type}
                              className="text-sm text-muted-foreground"
                            >
                              {type}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Price Range
                    </label>
                    <Slider
                      min={0}
                      max={20000000}
                      step={100000}
                      value={priceRange}
                      onValueChange={setPriceRange}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{formatPrice(priceRange[0])}</span>
                      <span>{formatPrice(priceRange[1])}</span>
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div className="w-full md:w-32">
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Min Bedrooms
                    </label>
                    <Select value={minBedrooms} onValueChange={setMinBedrooms}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bathrooms */}
                  <div className="w-full md:w-32">
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Min Bathrooms
                    </label>
                    <Select
                      value={minBathrooms}
                      onValueChange={setMinBathrooms}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Count and Actions */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {filteredProperties.length} properties found
            </p>
            <div className="flex items-center gap-2">
              {hasActiveFilters() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveSearchModal(true)}
                  className="text-primary hover:text-primary"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              )}
              {hasActiveFilters() && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">
                No properties found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                  : 'space-y-6'
              }
            >
              {filteredProperties.map((property) => (
                <Card
                  key={property._id || property.id}
                  className="property-card group overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={
                        property.images && property.images.length > 0
                          ? property.images[0]
                          : '/placeholder.jpg'
                      }
                      alt={property.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      {property.featured && (
                        <Badge
                          variant="secondary"
                          className="bg-accent text-accent-foreground"
                        >
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="font-heading font-semibold text-xl text-foreground mb-2 group-hover:text-accent transition-colors">
                        {property.title}
                      </h3>
                      <div className="flex items-center text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {property.ward &&
                          property.constituency &&
                          property.county
                            ? `${property.ward}, ${property.constituency}, ${property.county}`
                            : property.location}
                        </span>
                      </div>
                      <div className="font-heading font-bold text-2xl text-accent">
                        {formatPrice(property.price)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        <span>{property.bedrooms ?? 0} Bed</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        <span>{property.bathrooms ?? 0} Bath</span>
                      </div>
                      <div className="flex items-center">
                        <Square className="h-4 w-4 mr-1" />
                        <span>
                          {property.area ? property.area.toLocaleString() : 0}{' '}
                          sqft
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link to={`/listings/${property._id || property.id}`}>
                        <Button className="w-full">View Details</Button>
                      </Link>
                      <ScheduleViewingModal
                        propertyId={property._id || property.id}
                        propertyTitle={property.title}
                      >
                        <Button variant="outline" className="w-full">
                          Schedule Viewing
                        </Button>
                      </ScheduleViewingModal>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Search Modal */}
      <SaveSearchModal
        open={showSaveSearchModal}
        onOpenChange={setShowSaveSearchModal}
        searchCriteria={getCurrentSearchCriteria()}
      />
    </Layout>
  )
}
