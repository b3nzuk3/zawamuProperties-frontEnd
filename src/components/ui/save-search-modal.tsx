import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
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
import { Bell, Save, X } from 'lucide-react'

interface SaveSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchCriteria: {
    county?: string
    constituency?: string
    ward?: string
    propertyTypes?: string[]
    minPrice?: number
    maxPrice?: number
    minBedrooms?: number
    maxBedrooms?: number
    minBathrooms?: number
    maxBathrooms?: number
    searchTerm?: string
  }
}

export function SaveSearchModal({
  open,
  onOpenChange,
  searchCriteria,
}: SaveSearchModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    userEmail: '',
    userName: '',
    userPhone: '',
    alertFrequency: 'daily',
    maxAlertsPerDay: 5,
    isActive: true,
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        searchCriteria,
        alertSettings: {
          isActive: formData.isActive,
          frequency: formData.alertFrequency,
          maxAlertsPerDay: formData.maxAlertsPerDay,
        },
      }

      await api.post('/saved-searches', payload)

      toast({
        title: 'Search Saved Successfully!',
        description:
          'You will receive alerts when new properties match your criteria.',
      })

      onOpenChange(false)
      setFormData({
        name: '',
        description: '',
        userEmail: '',
        userName: '',
        userPhone: '',
        alertFrequency: 'daily',
        maxAlertsPerDay: 5,
        isActive: true,
      })
    } catch (error: any) {
      console.error('Error saving search:', error)
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Failed to save search. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const getSearchSummary = () => {
    const parts = []

    if (searchCriteria.county && searchCriteria.county !== 'all') {
      if (searchCriteria.ward) {
        parts.push(
          `${searchCriteria.ward}, ${searchCriteria.constituency}, ${searchCriteria.county}`
        )
      } else if (searchCriteria.constituency) {
        parts.push(`${searchCriteria.constituency}, ${searchCriteria.county}`)
      } else {
        parts.push(searchCriteria.county)
      }
    }

    if (
      searchCriteria.propertyTypes &&
      searchCriteria.propertyTypes.length > 0
    ) {
      parts.push(`${searchCriteria.propertyTypes.join(', ')} properties`)
    }

    if (searchCriteria.minPrice || searchCriteria.maxPrice) {
      const min = searchCriteria.minPrice
        ? `KSh ${searchCriteria.minPrice.toLocaleString()}`
        : 'Any'
      const max = searchCriteria.maxPrice
        ? `KSh ${searchCriteria.maxPrice.toLocaleString()}`
        : 'Any'
      parts.push(`Price: ${min} - ${max}`)
    }

    if (searchCriteria.minBedrooms || searchCriteria.maxBedrooms) {
      const min = searchCriteria.minBedrooms || 'Any'
      const max = searchCriteria.maxBedrooms || 'Any'
      parts.push(`Bedrooms: ${min} - ${max}`)
    }

    if (searchCriteria.searchTerm) {
      parts.push(`Search: "${searchCriteria.searchTerm}"`)
    }

    return parts.length > 0 ? parts.join(' • ') : 'All properties'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Your Search
          </DialogTitle>
          <DialogDescription>
            Save your current search criteria to get alerts when new matching
            properties are added.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Summary */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium text-foreground mb-1">
              Search Criteria:
            </div>
            <div className="text-sm text-muted-foreground">
              {getSearchSummary()}
            </div>
          </div>

          {/* Search Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Search Name *</Label>
            <Input
              id="name"
              placeholder="e.g., 3BR Apartments in Nairobi"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this search..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Your Information</div>

            <div className="space-y-2">
              <Label htmlFor="userName">Full Name *</Label>
              <Input
                id="userName"
                placeholder="Your full name"
                value={formData.userName}
                onChange={(e) => handleInputChange('userName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">Email Address *</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="your.email@example.com"
                value={formData.userEmail}
                onChange={(e) => handleInputChange('userEmail', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPhone">Phone Number (Optional)</Label>
              <Input
                id="userPhone"
                type="tel"
                placeholder="+254 700 000 000"
                value={formData.userPhone}
                onChange={(e) => handleInputChange('userPhone', e.target.value)}
              />
            </div>
          </div>

          {/* Alert Settings */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Alert Settings</div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange('isActive', checked)
                }
              />
              <Label htmlFor="isActive" className="text-sm">
                Enable email alerts for new matching properties
              </Label>
            </div>

            {formData.isActive && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="alertFrequency">Alert Frequency</Label>
                  <Select
                    value={formData.alertFrequency}
                    onValueChange={(value) =>
                      handleInputChange('alertFrequency', value)
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
                  <Label htmlFor="maxAlertsPerDay">Max Alerts Per Day</Label>
                  <Select
                    value={formData.maxAlertsPerDay.toString()}
                    onValueChange={(value) =>
                      handleInputChange('maxAlertsPerDay', parseInt(value))
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
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Search
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
