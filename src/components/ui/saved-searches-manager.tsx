import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card'
import { Button } from './button'
import { Badge } from './badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Label } from './label'
import { Input } from './input'
import { Textarea } from './textarea'
import { useToast } from './use-toast'
import { savedSearchApi } from '../../lib/savedSearchApi'
import {
  isSavedSearchUnauthorized,
  savedSearchSessionConfig,
} from '../../lib/savedSearchApi'
import type { SavedSearchSession } from '../../lib/savedSearchApi'
import { PropertyBadges } from '../properties/PropertyBadges'
import { PropertyPrice } from '../properties/PropertyPrice'
import { getPropertyLocation } from '../../lib/property'
import { getImageUrl } from '../../lib/media'
import {
  summarizeSavedSearchCriteria,
  validateSavedSearchCriteria,
} from '../../lib/savedSearch'

import type { Property } from '../../types/property'
import {
  Bell,
  BellOff,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Search,
  AlertCircle,
} from 'lucide-react'

interface SavedSearch {
  _id: string
  name: string
  description?: string
  searchCriteria: unknown
  alertSettings: {
    isActive: boolean
    frequency: string
    maxAlertsPerDay: number
  }
  verifiedAt?: string | null
  alertConsentAt?: string | null

  createdAt: string
  updatedAt?: string
}

interface SavedSearchesManagerProps {
  session: SavedSearchSession
  onSessionInvalid: (token: string) => void
}

interface MatchingState {
  open: boolean
  loading: boolean
  properties: Partial<Property>[]
  total?: number
  error?: string
}

interface SavedSearchPagination {
  currentPage: number
  totalPages: number
  totalSearches: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const SAVED_SEARCH_PAGE_SIZE = 20

function MatchingPropertyPreview({ property }: { property: Partial<Property> }) {
  const typedProperty = property as Property
  const location = getPropertyLocation(typedProperty)
  const facts = [
    typeof property.type === 'string' ? property.type : null,
    typeof property.bedrooms === 'number' && Number.isFinite(property.bedrooms)
      ? `${property.bedrooms} bed` : null,
    typeof property.bathrooms === 'number' && Number.isFinite(property.bathrooms)
      ? `${property.bathrooms} bath` : null,
    typeof property.area === 'number' && Number.isFinite(property.area)
      ? `${property.area.toLocaleString()} sqft` : null,
  ].filter((fact): fact is string => Boolean(fact))

  return (
    <article className="rounded-lg border border-border bg-card p-4" data-testid="matched-property-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {property.images?.[0] && (
          <img
            src={getImageUrl(property.images[0], 'card')}
            alt={property.title || 'Matched property'}
            className="h-28 w-full rounded-md object-cover sm:h-24 sm:w-32 sm:shrink-0"
          />
        )}
        <div className="min-w-0 space-y-2">
          {property.title && (
            property._id
              ? <a className="font-semibold text-foreground hover:text-primary" href={`/listings/${property._id}`}>{property.title}</a>
              : <h4 className="font-semibold text-foreground">{property.title}</h4>
          )}
          <PropertyBadges property={typedProperty} />
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            {location || 'Location unavailable'}
          </p>
          {facts.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {facts.map((fact) => <span key={fact}>{fact}</span>)}
            </div>
          )}
        </div>
        <PropertyPrice property={typedProperty} className="shrink-0" />
      </div>
    </article>
  )
}

function hasAlertConsent(search: SavedSearch): boolean {
  return Boolean(search.alertSettings.isActive && search.verifiedAt && search.alertConsentAt)
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function SavedSearchesManager({ session, onSessionInvalid }: SavedSearchesManagerProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<SavedSearchPagination>({
    currentPage: 1,
    totalPages: 1,
    totalSearches: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)
  const [editFormData, setEditFormData] = useState({ name: '', description: '', frequency: 'daily', maxAlertsPerDay: 5 })
  const [editLoading, setEditLoading] = useState(false)
  const [busySearchId, setBusySearchId] = useState<string | null>(null)
  const [matchingStates, setMatchingStates] = useState<Record<string, MatchingState>>({})
  const { toast } = useToast()
  const sessionRef = useRef(session)
  const requestRevision = useRef(0)
  sessionRef.current = session

  const isCurrentSession = useCallback(() => (
    sessionRef.current.token === session.token && Date.parse(session.expiresAt) > Date.now()
  ), [session])

  const fetchSavedSearches = useCallback(async () => {
    const revision = ++requestRevision.current
    setLoading(true)
    setLoadError('')
    try {
      const response = await savedSearchApi.get(
        `/saved-searches?page=${page}&limit=${SAVED_SEARCH_PAGE_SIZE}`,
        savedSearchSessionConfig(session.token),
      )
      if (revision !== requestRevision.current || !isCurrentSession()) return
      const body = response.data as { data?: unknown; pagination?: unknown }
      const data: unknown = body?.data
      const rawPagination = body?.pagination
      const pageInfo = rawPagination && typeof rawPagination === 'object'
        ? rawPagination as Partial<SavedSearchPagination>
        : null
      if (
        pageInfo && Number.isInteger(pageInfo.currentPage) &&
        Number.isInteger(pageInfo.totalPages) && Number.isInteger(pageInfo.totalSearches) &&
        typeof pageInfo.hasNextPage === 'boolean' && typeof pageInfo.hasPrevPage === 'boolean'
      ) {
        const lastPage = Math.max(1, pageInfo.totalPages)
        const responsePage = Math.max(1, Math.min(pageInfo.currentPage, lastPage))
        if (responsePage !== page) {
          setPage(responsePage)
          return
        }
        setSavedSearches(Array.isArray(data) ? data as SavedSearch[] : [])
        setPagination({ ...pageInfo, currentPage: responsePage, totalPages: lastPage } as SavedSearchPagination)
      } else {
        const totalSearches = Array.isArray(data) ? data.length : 0
        setSavedSearches(Array.isArray(data) ? data as SavedSearch[] : [])
        setPagination({
          currentPage: page,
          totalPages: 1,
          totalSearches,
          hasNextPage: false,
          hasPrevPage: false,
        })
      }
    } catch (error) {
      if (revision !== requestRevision.current || !isCurrentSession()) return
      if (isSavedSearchUnauthorized(error)) {
        onSessionInvalid(session.token)
      } else {
        setLoadError('Failed to load saved searches. Try again.')
      }
    } finally {
      if (revision === requestRevision.current && isCurrentSession()) setLoading(false)
    }
  }, [isCurrentSession, onSessionInvalid, page, session.token])

  useEffect(() => {
    void fetchSavedSearches()
    return () => { requestRevision.current += 1 }
  }, [fetchSavedSearches])

  const handleDeleteSearch = async (searchId: string) => {
    if (!window.confirm('Delete this saved search?')) return
    setBusySearchId(searchId)
    try {
      await savedSearchApi.delete(`/saved-searches/${searchId}`, savedSearchSessionConfig(session.token))
      if (!isCurrentSession()) return
      toast({ title: 'Search deleted', description: 'The saved search was removed.' })
      await fetchSavedSearches()
    } catch (error) {
      if (!isCurrentSession()) return
      if (isSavedSearchUnauthorized(error)) onSessionInvalid(session.token)
      else toast({ title: 'Error', description: 'Failed to delete the saved search.', variant: 'destructive' })
    } finally {
      if (isCurrentSession()) setBusySearchId(null)
    }
  }

  const handleEditSearch = (search: SavedSearch) => {
    const validation = validateSavedSearchCriteria(search.searchCriteria)
    if (!validation.valid || validation.criteria === null) return
    setEditingSearch(search)
    setEditFormData({
      name: search.name,
      description: search.description || '',
      frequency: search.alertSettings.frequency,
      maxAlertsPerDay: search.alertSettings.maxAlertsPerDay,
    })
  }

  const handleUpdateSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingSearch) return
    const validation = validateSavedSearchCriteria(editingSearch.searchCriteria)
    if (!validation.valid || validation.criteria === null) return
    const searchId = editingSearch._id
    setEditLoading(true)
    try {
      await savedSearchApi.put(`/saved-searches/${searchId}`, {
        name: editFormData.name,
        description: editFormData.description,
        alertSettings: {
          frequency: editFormData.frequency,
          maxAlertsPerDay: editFormData.maxAlertsPerDay,
        },
      }, savedSearchSessionConfig(session.token))
      if (!isCurrentSession()) return
      setEditingSearch(null)
      toast({ title: 'Search updated', description: 'The saved search details were updated.' })
      await fetchSavedSearches()
    } catch (error) {
      if (!isCurrentSession()) return
      if (isSavedSearchUnauthorized(error)) onSessionInvalid(session.token)
      else toast({ title: 'Error', description: 'Failed to update the saved search.', variant: 'destructive' })
    } finally {
      if (isCurrentSession()) setEditLoading(false)
    }
  }

  const handleAlertConsent = async (search: SavedSearch) => {
    const validation = validateSavedSearchCriteria(search.searchCriteria)
    if (!validation.valid || validation.criteria === null) return
    const enable = !hasAlertConsent(search)
    setBusySearchId(search._id)
    try {
      await savedSearchApi.put(`/saved-searches/${search._id}`, {
        alertSettings: {
          isActive: enable,
          frequency: search.alertSettings.frequency,
          maxAlertsPerDay: search.alertSettings.maxAlertsPerDay,
        },
      }, savedSearchSessionConfig(session.token))
      if (!isCurrentSession()) return
      toast({
        title: enable ? 'Alerts enabled' : 'Alerts turned off',
        description: enable
          ? 'Email alerts are enabled for this search only.'
          : 'Email alerts are off for this search.',
      })
      await fetchSavedSearches()
    } catch (error) {
      if (!isCurrentSession()) return
      if (isSavedSearchUnauthorized(error)) onSessionInvalid(session.token)
      else toast({ title: 'Error', description: 'Could not update alert consent.', variant: 'destructive' })
    } finally {
      if (isCurrentSession()) setBusySearchId(null)
    }
  }

  const toggleMatchingProperties = async (searchId: string) => {
    const current = matchingStates[searchId]
    if (current?.open) {
      setMatchingStates((previous) => ({ ...previous, [searchId]: { ...current, open: false } }))
      return
    }
    if (current && !current.error) {
      setMatchingStates((previous) => ({ ...previous, [searchId]: { ...current, open: true } }))
      return
    }

    const revision = requestRevision.current
    setMatchingStates((previous) => ({
      ...previous,
      [searchId]: { open: true, loading: true, properties: [] },
    }))
    try {
      const response = await savedSearchApi.get(`/saved-searches/${searchId}/properties`, savedSearchSessionConfig(session.token))
      if (!isCurrentSession() || revision !== requestRevision.current) return
      const data = response.data?.data
      const rawProperties: unknown = Array.isArray(data) ? data : data?.properties
      const allProperties = Array.isArray(rawProperties) ? rawProperties as Partial<Property>[] : []
      const total = typeof data?.pagination?.totalProperties === 'number'
        ? data.pagination.totalProperties
        : allProperties.length
      setMatchingStates((previous) => ({
        ...previous,
        [searchId]: {
          open: true,
          loading: false,
          properties: allProperties.slice(0, 10),
          total,
        },
      }))
    } catch (error) {
      if (!isCurrentSession() || revision !== requestRevision.current) return
      if (isSavedSearchUnauthorized(error)) {
        onSessionInvalid(session.token)
        return
      }
      setMatchingStates((previous) => ({
        ...previous,
        [searchId]: {
          open: true,
          loading: false,
          properties: [],
          error: 'Failed to load matching properties. Try again.',
        },
      }))
    }
  }

  const pageCount = Math.max(pagination.totalPages, 1)
  const firstVisibleSearch = pagination.totalSearches === 0
    ? 0
    : (pagination.currentPage - 1) * SAVED_SEARCH_PAGE_SIZE + 1
  const lastVisibleSearch = Math.min(
    pagination.currentPage * SAVED_SEARCH_PAGE_SIZE,
    pagination.totalSearches,
  )
  const paginationSummary = (
    <p className="text-sm text-muted-foreground">
      Showing {firstVisibleSearch}–{lastVisibleSearch} of {pagination.totalSearches} saved searches · Page {pagination.currentPage} of {pageCount}
    </p>
  )
  const paginationControls = pageCount > 1 && (
    <div className="flex justify-end gap-2" aria-label="Saved search pages">
      <Button type="button" variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!pagination.hasPrevPage}>
        Previous page
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={!pagination.hasNextPage}>
        Next page
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="mt-2 text-muted-foreground">Loading saved searches…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p role="alert" className="text-destructive">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => void fetchSavedSearches()}>Try again</Button>
      </div>
    )
  }

  if (savedSearches.length === 0) {
    return (
      <div className="space-y-4">
        <div className="py-8 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold">{pagination.totalSearches > 0 ? 'No saved searches on this page' : 'No saved searches'}</h2>
          {pagination.totalSearches === 0 && <p className="text-muted-foreground">Save a search from the listings page to manage it here.</p>}
        </div>
        {paginationSummary}
        {paginationControls}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Saved Searches</h2>
          <p className="text-muted-foreground">Review criteria and choose alert consent separately for each search.</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {savedSearches.length} saved search{savedSearches.length === 1 ? '' : 'es'}
        </Badge>
      </div>

      {paginationSummary}
      {paginationControls}

      <div className="grid gap-4">
        {savedSearches.map((search) => {
          const criteriaValidation = validateSavedSearchCriteria(search.searchCriteria)
          const matchingState = matchingStates[search._id]
          const validCriteria = criteriaValidation.valid && criteriaValidation.criteria !== null
          const alertsEnabled = validCriteria && hasAlertConsent(search)
          return (
            <Card key={search._id} data-testid="saved-search-card" className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{search.name}</CardTitle>
                    {search.description && <CardDescription>{search.description}</CardDescription>}
                  </div>
                  <Badge variant={alertsEnabled ? 'default' : 'secondary'} className="text-xs">
                    {!validCriteria ? 'Invalid criteria' : alertsEnabled ? <><Bell className="mr-1 h-3 w-3" />Alerts on</> : <><BellOff className="mr-1 h-3 w-3" />Alerts off</>}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-3">
                  <div className="mb-2 text-sm font-medium text-foreground">Search criteria</div>
                  <div className="text-sm text-muted-foreground">
                    {criteriaValidation.valid && criteriaValidation.criteria
                      ? summarizeSavedSearchCriteria(criteriaValidation.criteria)
                      : <span role="alert">Saved search criteria cannot be replayed: {criteriaValidation.error ?? 'Unknown criteria error.'}</span>}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p role="status" className="text-muted-foreground">
                    {!validCriteria
                      ? 'Alerts and results are unavailable until this saved search is corrected or deleted.'
                      : alertsEnabled
                      ? `Verified ${formatDate(search.verifiedAt)} · alert consent recorded ${formatDate(search.alertConsentAt)}`
                      : 'Alerts are off until you explicitly enable them for this search.'}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Frequency:</span><span className="font-medium capitalize">{search.alertSettings.frequency}</span></div>
                    <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Max/day:</span><span className="font-medium">{search.alertSettings.maxAlertsPerDay}</span></div>

                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Created:</span><span className="font-medium">{formatDate(search.createdAt)}</span></div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleEditSearch(search)} disabled={busySearchId === search._id || !validCriteria}>
                    <Edit className="mr-2 h-4 w-4" />Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!criteriaValidation.valid || criteriaValidation.criteria === null}
                    onClick={() => {
                      if (!criteriaValidation.valid || criteriaValidation.criteria === null) return
                      window.open(`/listings?search=${encodeURIComponent(JSON.stringify(criteriaValidation.criteria))}`, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />View Results
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void toggleMatchingProperties(search._id)}
                    aria-expanded={matchingState?.open ?? false}
                    disabled={!criteriaValidation.valid || criteriaValidation.criteria === null || (matchingState?.loading ?? false)}
                  >
                    {matchingState?.open ? 'Hide matching properties' : 'Show matching properties'}
                  </Button>
                  <Button type="button" variant={alertsEnabled ? 'outline' : 'default'} size="sm" onClick={() => void handleAlertConsent(search)} disabled={busySearchId === search._id || !validCriteria}>
                    {!validCriteria ? 'Alerts unavailable' : alertsEnabled ? 'Turn alerts off' : 'Enable email alerts'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleDeleteSearch(search._id)} disabled={busySearchId === search._id} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />Delete
                  </Button>
                </div>

                {matchingState?.open && (
                  <div className="space-y-3 border-t border-border pt-4" aria-label={`Matching properties for ${search.name}`}>
                    {matchingState.loading && <p className="text-sm text-muted-foreground">Loading matching properties…</p>}
                    {matchingState.error && <p className="text-sm text-destructive" role="alert">{matchingState.error}</p>}
                    {!matchingState.loading && !matchingState.error && matchingState.properties.length === 0 && <p className="text-sm text-muted-foreground">No matching properties found.</p>}
                    {!matchingState.loading && matchingState.properties.map((property, index) => (
                      <MatchingPropertyPreview key={property._id ?? `${search._id}-match-${index}`} property={property} />
                    ))}
                    {!matchingState.loading && matchingState.properties.length > 0 && (matchingState.total ?? 0) > 10 && (
                      <p className="text-sm text-muted-foreground">Showing the first 10 of {matchingState.total} matching properties.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={Boolean(editingSearch)} onOpenChange={(open) => { if (!open) setEditingSearch(null) }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit saved search</DialogTitle>
            <DialogDescription>Update search details, cadence and daily quota. These settings do not enable alerts; consent is managed separately.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Search name</Label>
              <Input id="edit-name" value={editFormData.name} onChange={(event) => setEditFormData((previous) => ({ ...previous, name: event.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={editFormData.description} onChange={(event) => setEditFormData((previous) => ({ ...previous, description: event.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-frequency">Alert frequency</Label>
              <select id="edit-frequency" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={editFormData.frequency} onChange={event => setEditFormData(previous => ({ ...previous, frequency: event.target.value }))}>
                <option value="immediate">Each worker invocation</option>
                <option value="daily">Daily at 09:00 Africa/Nairobi</option>
                <option value="weekly">Monday at 09:00 Africa/Nairobi</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max-alerts">Maximum alerts per day</Label>
              <Input id="edit-max-alerts" type="number" required min={1} max={20} step={1} value={editFormData.maxAlertsPerDay} onChange={event => setEditFormData(previous => ({ ...previous, maxAlertsPerDay: Number(event.target.value) }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingSearch(null)} disabled={editLoading} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={editLoading} className="flex-1">{editLoading ? 'Updating…' : 'Update search'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
