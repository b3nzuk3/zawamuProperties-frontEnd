import React, { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Checkbox } from './checkbox'
import { useToast } from './use-toast'
import api from '../../lib/api'
import {
  Bell,
  BellOff,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Home,
  DollarSign,
  Bed,
  Bath,
  Search,
  AlertCircle,
} from 'lucide-react'

interface SavedSearch {
  _id: string
  name: string
  description?: string
  userEmail: string
  userName: string
  userPhone?: string
  searchCriteria: {
    county?: string
    constituency?: string
    ward?: string
    propertyTypes?: string[]
    minPrice?: number
    maxPrice?: number
    maxPrice?: number
    minBedrooms?: number
    maxBedrooms?: number
    minBathrooms?: number
    maxBathrooms?: number
    searchTerm?: string
  }
  alertSettings: {
    isActive: boolean
    frequency: string
    maxAlertsPerDay: number
  }
  totalAlertsSent: number
  lastAlertSent?: string
  createdAt: string
  updatedAt: string
}

interface SavedSearchesManagerProps {
  userEmail: string
}

export function SavedSearchesManager({ userEmail }: SavedSearchesManagerProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    alertFrequency: 'daily',
    maxAlertsPerDay: 5,
    isActive: true,
  })
  const [editLoading, setEditLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (userEmail) {
      fetchSavedSearches()
    }
  }, [userEmail])

  const fetchSavedSearches = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/saved-searches/user/${userEmail}`)
      setSavedSearches(response.data.data || [])
    } catch (error) {
      console.error('Error fetching saved searches:', error)
      toast({
        title: 'Error',
        description: 'Failed to load saved searches',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) {
      return
    }

    try {
      await api.delete(`/saved-searches/${searchId}`)
      toast({
        title: 'Search Deleted',
        description: 'Your saved search has been deleted successfully.',
      })
      fetchSavedSearches()
    } catch (error) {
      console.error('Error deleting saved search:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete saved search',
        variant: 'destructive',
      })
    }
  }

  const handleEditSearch = (search: SavedSearch) => {
    setEditingSearch(search)
    setEditFormData({
      name: search.name,
      description: search.description || '',
      alertFrequency: search.alertSettings.frequency,
      maxAlertsPerDay: search.alertSettings.maxAlertsPerDay,
      isActive: search.alertSettings.isActive,
    })
  }

  const handleUpdateSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSearch) return

    try {
      setEditLoading(true)
      await api.put(`/saved-searches/${editingSearch._id}`, {
        name: editFormData.name,
        description: editFormData.description,
        alertSettings: {
          isActive: editFormData.isActive,
          frequency: editFormData.alertFrequency,
          maxAlertsPerDay: editFormData.maxAlertsPerDay,
        },
      })

      toast({
        title: 'Search Updated',
        description: 'Your saved search has been updated successfully.',
      })

      setEditingSearch(null)
      fetchSavedSearches()
    } catch (error) {
      console.error('Error updating saved search:', error)
      toast({
        title: 'Error',
        description: 'Failed to update saved search',
        variant: 'destructive',
      })
    } finally {
      setEditLoading(false)
    }
  }

  const getSearchSummary = (search: SavedSearch) => {
    const parts = []
    const criteria = search.searchCriteria

    if (criteria.county && criteria.county !== 'all') {
      if (criteria.ward) {
        parts.push(
          `${criteria.ward}, ${criteria.constituency}, ${criteria.county}`
        )
      } else if (criteria.constituency) {
        parts.push(`${criteria.constituency}, ${criteria.county}`)
      } else {
        parts.push(criteria.county)
      }
    }

    if (criteria.propertyTypes && criteria.propertyTypes.length > 0) {
      parts.push(`${criteria.propertyTypes.join(', ')}`)
    }

    if (criteria.minPrice || criteria.maxPrice) {
      const min = criteria.minPrice
        ? `KSh ${criteria.minPrice.toLocaleString()}`
        : 'Any'
      const max = criteria.maxPrice
        ? `KSh ${criteria.maxPrice.toLocaleString()}`
        : 'Any'
      parts.push(`${min} - ${max}`)
    }

    return parts.length > 0 ? parts.join(' • ') : 'All properties'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">
            Loading saved searches...
          </p>
        </div>
      </div>
    )
  }

  if (savedSearches.length === 0) {
    return (
      <div className="text-center py-8">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Saved Searches</h3>
        <p className="text-muted-foreground">
          You haven't saved any searches yet. Save a search from the listings
          page to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Saved Searches</h2>
          <p className="text-muted-foreground">
            Manage your saved searches and alert preferences
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {savedSearches.length} saved search
          {savedSearches.length !== 1 ? 'es' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {savedSearches.map((search) => (
          <Card key={search._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{search.name}</CardTitle>
                  {search.description && (
                    <CardDescription>{search.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      search.alertSettings.isActive ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {search.alertSettings.isActive ? (
                      <>
                        <Bell className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <BellOff className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Search Criteria Summary */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium text-foreground mb-2">
                  Search Criteria:
                </div>
                <div className="text-sm text-muted-foreground">
                  {getSearchSummary(search)}
                </div>
              </div>

              {/* Alert Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Frequency:</span>
                  <span className="font-medium capitalize">
                    {search.alertSettings.frequency}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Max/Day:</span>
                  <span className="font-medium">
                    {search.alertSettings.maxAlertsPerDay}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Total Alerts:</span>
                  <span className="font-medium">{search.totalAlertsSent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {formatDate(search.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditSearch(search)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `/listings?search=${encodeURIComponent(
                        JSON.stringify(search.searchCriteria)
                      )}`,
                      '_blank'
                    )
                  }
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Results
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSearch(search._id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog
        open={!!editingSearch}
        onOpenChange={() => setEditingSearch(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Saved Search</DialogTitle>
            <DialogDescription>
              Update your search name, description, and alert settings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Search Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isActive"
                checked={editFormData.isActive}
                onCheckedChange={(checked) =>
                  setEditFormData((prev) => ({ ...prev, isActive: !!checked }))
                }
              />
              <Label htmlFor="edit-isActive" className="text-sm">
                Enable email alerts
              </Label>
            </div>

            {editFormData.isActive && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-frequency">Alert Frequency</Label>
                  <Select
                    value={editFormData.alertFrequency}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        alertFrequency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-maxAlerts">Max Alerts Per Day</Label>
                  <Select
                    value={editFormData.maxAlertsPerDay.toString()}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        maxAlertsPerDay: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSearch(null)}
                disabled={editLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading} className="flex-1">
                {editLoading ? 'Updating...' : 'Update Search'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
