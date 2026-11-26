import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import {
  Search,
  Filter,
  MapPin,
  Bed,
  Bath,
  Square,
  Grid,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useSearchParams } from 'react-router-dom'
import api from '@/lib/api'
import { SaveSearchModal } from '@/components/ui/save-search-modal'
import { PropertyBadges, PropertyFeaturedBadge } from '@/components/properties/PropertyBadges'
import { PropertyPrice } from '@/components/properties/PropertyPrice'
import { PropertyCardActions } from '@/components/properties/PropertyCardActions'
import {
  getPropertyLocation,
  SALE_PROPERTY_TYPES,
} from '@/lib/property'
import { getImageUrl } from '@/lib/media'
import {
  matchesSavedSearchCriteria,
  parseSavedSearchCriteria,
  summarizeSavedSearchCriteria,
} from '@/lib/savedSearch'
import type { SavedSearchCriteria } from '@/lib/savedSearch'
import type { Property } from '@/types/property'

type ListingProperty = Property & { id?: string; image?: string }
type PurposeFilter = 'all' | 'sale' | 'rent'

function parsePriceFilter(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const savedSearchQuery = searchParams.get('search')
  const [initialReplay] = useState(() => parseSavedSearchCriteria(savedSearchQuery))
  const initialCriteria = initialReplay.valid && initialReplay.criteria ? initialReplay.criteria : {}
  const initialCriteriaError = initialReplay.valid && initialReplay.criteria
    ? null
    : initialReplay.error ?? 'Saved search criteria are invalid.'
  const [properties, setProperties] = useState<ListingProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(initialCriteria.searchTerm ?? '')
  const [locationFilter, setLocationFilter] = useState(initialCriteria.location ?? '')
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>(initialCriteria.listingPurpose ?? 'all')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialCriteria.propertyTypes ?? [])
  const [minPrice, setMinPrice] = useState(initialCriteria.minPrice !== undefined ? String(initialCriteria.minPrice) : '')
  const [maxPrice, setMaxPrice] = useState(initialCriteria.maxPrice !== undefined ? String(initialCriteria.maxPrice) : '')
  const [minBedrooms, setMinBedrooms] = useState(initialCriteria.minBedrooms !== undefined ? String(initialCriteria.minBedrooms) : 'any')
  const [minBathrooms, setMinBathrooms] = useState(initialCriteria.minBathrooms !== undefined ? String(initialCriteria.minBathrooms) : 'any')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false)
  const [replayCriteria, setReplayCriteria] = useState<SavedSearchCriteria>(initialCriteria)
  const [replayCriteriaError, setReplayCriteriaError] = useState<string | null>(initialCriteriaError)
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(savedSearchQuery)

  useEffect(() => {
    api
      .get('/properties')
      .then((res) => setProperties(res.data))
      .catch(() => setError('Failed to load properties'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const parsed = parseSavedSearchCriteria(savedSearchQuery)
    if (parsed.valid === false || parsed.criteria === null) {
      setReplayCriteria({})
      setReplayCriteriaError(parsed.error ?? 'Saved search criteria are invalid.')
      setSearchTerm('')
      setLocationFilter('')
      setPurposeFilter('all')
      setSelectedTypes([])
      setMinPrice('')
      setMaxPrice('')
      setMinBedrooms('any')
      setMinBathrooms('any')
      setAppliedSearchQuery(savedSearchQuery)
      return
    }

    const criteria = parsed.criteria
    setReplayCriteria(criteria)
    setReplayCriteriaError(null)
    setSearchTerm(criteria.searchTerm ?? '')
    setLocationFilter(criteria.location ?? '')
    setPurposeFilter(criteria.listingPurpose ?? 'all')
    setSelectedTypes(criteria.propertyTypes ?? [])
    setMinPrice(criteria.minPrice !== undefined ? String(criteria.minPrice) : '')
    setMaxPrice(criteria.maxPrice !== undefined ? String(criteria.maxPrice) : '')
    setMinBedrooms(criteria.minBedrooms !== undefined ? String(criteria.minBedrooms) : 'any')
    setMinBathrooms(criteria.minBathrooms !== undefined ? String(criteria.minBathrooms) : 'any')
    setAppliedSearchQuery(savedSearchQuery)
  }, [savedSearchQuery])

  const minimumPrice = parsePriceFilter(minPrice)
  const maximumPrice = parsePriceFilter(maxPrice)

  const getCurrentSearchCriteria = (): SavedSearchCriteria => {
    const criteria = { ...replayCriteria }
    const visibleCriteriaFields: (keyof SavedSearchCriteria)[] = [
      'location', 'listingPurpose', 'propertyTypes', 'minPrice', 'maxPrice',
      'minBedrooms', 'minBathrooms', 'searchTerm',
    ]
    visibleCriteriaFields.forEach((field) => delete criteria[field])

    const normalizedSearch = searchTerm.trim()
    const normalizedLocation = locationFilter.trim()
    if (normalizedSearch) criteria.searchTerm = normalizedSearch
    if (normalizedLocation) criteria.location = normalizedLocation
    if (purposeFilter !== 'all') criteria.listingPurpose = purposeFilter
    if (selectedTypes.length > 0) criteria.propertyTypes = [...selectedTypes]
    if (minimumPrice !== null) criteria.minPrice = minimumPrice
    if (maximumPrice !== null) criteria.maxPrice = maximumPrice
    if (minBedrooms !== 'any') criteria.minBedrooms = Number(minBedrooms)
    if (minBathrooms !== 'any') criteria.minBathrooms = Number(minBathrooms)
    return criteria
  }

  const currentSearchCriteria = getCurrentSearchCriteria()
  const replayPending = appliedSearchQuery !== savedSearchQuery
  const filteredProperties = replayPending || replayCriteriaError
    ? []
    : properties.filter((property) => matchesSavedSearchCriteria(property, currentSearchCriteria))

  const handleTypeChange = (type: string, checked: boolean) => {
    setSelectedTypes((current) => checked
      ? current.includes(type) ? current : [...current, type]
      : current.filter((selectedType) => selectedType !== type))
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setLocationFilter('')
    setPurposeFilter('all')
    setSelectedTypes([])
    setMinPrice('')
    setMaxPrice('')
    setMinBedrooms('any')
    setMinBathrooms('any')
    setReplayCriteria({})
    setReplayCriteriaError(null)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('search')
      return next
    })
  }

  const hasActiveFilters = replayPending || Object.keys(currentSearchCriteria).length > 0 || replayCriteriaError !== null

  const getPropertyId = (property: ListingProperty) => property._id || property.id

  const getActionProperty = (property: ListingProperty): Property => ({
    ...property,
    _id: property._id || property.id,
  })

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
                  aria-label="Grid view"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  aria-label="List view"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div role="group" aria-label="Listing purpose" className="flex flex-wrap gap-2">
              {([
                ['all', 'All'],
                ['sale', 'For Sale'],
                ['rent', 'For Rent'],
              ] as const).map(([purpose, label]) => (
                <Button
                  key={purpose}
                  type="button"
                  variant={purposeFilter === purpose ? 'default' : 'outline'}
                  aria-pressed={purposeFilter === purpose}
                  onClick={() => setPurposeFilter(purpose)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="flex flex-col gap-6 mt-4">
                <div className="max-w-md">
                  <label htmlFor="listing-location" className="text-sm font-medium text-foreground mb-2 block">
                    Location
                  </label>
                  <Input
                    id="listing-location"
                    value={locationFilter}
                    onChange={(event) => setLocationFilter(event.target.value)}
                    placeholder="Enter a location"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  {/* Property Type */}
                  <div className="w-full md:w-48">
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Property Type
                    </label>
                    <div className="space-y-2">
                      {SALE_PROPERTY_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
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
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 min-w-64">
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Price Range{purposeFilter === 'rent' ? ' (monthly)' : ''}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="minimum-price" className="text-xs text-muted-foreground mb-1 block">
                          Minimum price
                        </label>
                        <Input
                          id="minimum-price"
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          placeholder="No minimum"
                          value={minPrice}
                          onChange={(event) => setMinPrice(event.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="maximum-price" className="text-xs text-muted-foreground mb-1 block">
                          Maximum price
                        </label>
                        <Input
                          id="maximum-price"
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          placeholder="No maximum"
                          value={maxPrice}
                          onChange={(event) => setMaxPrice(event.target.value)}
                        />
                      </div>
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

          {replayCriteriaError && (
            <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm" role="alert">
              <span className="font-medium">Saved search could not be replayed.</span>{' '}
              {replayCriteriaError} No listings are shown. Clear the saved criteria to browse again.
            </div>
          )}
          {replayPending && (
            <div className="mb-6 text-sm text-muted-foreground" role="status">
              Applying saved search criteria…
            </div>
          )}

          {Object.keys(replayCriteria).length > 0 && (
            <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground" role="status">
              <span className="font-medium text-foreground">Saved criteria: </span>
              {summarizeSavedSearchCriteria(currentSearchCriteria)}
            </div>
          )}

          {/* Results Count and Actions */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {filteredProperties.length} properties found
            </p>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveSearchModal(true)}
                  disabled={replayPending || replayCriteriaError !== null}
                  className="text-primary hover:text-primary"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              )}
              {hasActiveFilters && (
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
                  data-testid="property-card"
                  className="property-card group relative isolate overflow-hidden"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={getImageUrl(property.images?.[0] || property.image || '/placeholder.jpg', 'card')}
                      alt={property.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <PropertyBadges property={property} showFeatured={false} className="absolute top-4 left-4 right-4" />
                    {property.featured === true && <PropertyFeaturedBadge className="absolute bottom-4 left-4" />}
                  </div>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="font-heading font-semibold text-xl text-foreground mb-2 group-hover:text-accent transition-colors">
                        {property.title}
                      </h3>
                      <div className="flex items-center text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {getPropertyLocation(property)}
                        </span>
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
                        <span>
                          {property.area ? property.area.toLocaleString() : 0}{' '}
                          sqft
                        </span>
                      </div>
                    </div>
                    <PropertyCardActions property={getActionProperty(property)} />
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
        searchCriteria={currentSearchCriteria}
      />
    </Layout>
  )
}
