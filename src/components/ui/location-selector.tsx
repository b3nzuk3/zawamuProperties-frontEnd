import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MapPin } from 'lucide-react'

interface County {
  county_code: number
  county_name: string
  constituencies: Constituency[]
}

interface Constituency {
  constituency_name: string
  wards: Ward[]
  constituency_coordinates: [number, number] | null
}

interface Ward {
  ward_name: string
  ward_coordinates: [number, number] | null
}

interface LocationSelectorProps {
  onLocationChange: (location: {
    county: string
    constituency: string
    ward: string
    coordinates?: [number, number]
  }) => void
  initialLocation?: {
    county: string
    constituency: string
    ward: string
  }
}

export function LocationSelector({
  onLocationChange,
  initialLocation,
}: LocationSelectorProps) {
  const [counties, setCounties] = useState<County[]>([])
  const [selectedCounty, setSelectedCounty] = useState(
    initialLocation?.county || ''
  )
  const [selectedConstituency, setSelectedConstituency] = useState(
    initialLocation?.constituency || ''
  )
  const [selectedWard, setSelectedWard] = useState(initialLocation?.ward || '')
  const [constituencies, setConstituencies] = useState<Constituency[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load Kenya locations data
    const loadLocations = async () => {
      try {
        const response = await fetch('/kenya_locations.json')
        const data = await response.json()
        setCounties(data)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load locations:', error)
        setLoading(false)
      }
    }
    loadLocations()
  }, [])

  useEffect(() => {
    if (selectedCounty) {
      const county = counties.find((c) => c.county_name === selectedCounty)
      if (county) {
        setConstituencies(county.constituencies)
        setSelectedConstituency('')
        setSelectedWard('')
        setWards([])
      }
    }
  }, [selectedCounty, counties])

  useEffect(() => {
    if (selectedConstituency && selectedCounty) {
      const county = counties.find((c) => c.county_name === selectedCounty)
      if (county) {
        const constituency = county.constituencies.find(
          (c) => c.constituency_name === selectedConstituency
        )
        if (constituency) {
          setWards(constituency.wards)
          setSelectedWard('')
        }
      }
    }
  }, [selectedConstituency, selectedCounty, counties])

  useEffect(() => {
    // Handle "All Properties" selection
    if (selectedCounty === 'all') {
      onLocationChange({
        county: '',
        constituency: '',
        ward: '',
      })
      return
    }

    // Handle specific location selection - trigger on any field change
    if (selectedCounty && selectedCounty !== 'all') {
      const county = counties.find((c) => c.county_name === selectedCounty)
      if (county) {
        // If ward is selected, use ward coordinates
        if (selectedWard && selectedConstituency) {
          const constituency = county.constituencies.find(
            (c) => c.constituency_name === selectedConstituency
          )
          if (constituency) {
            const ward = constituency.wards.find(
              (w) => w.ward_name === selectedWard
            )
            if (ward) {
              onLocationChange({
                county: selectedCounty,
                constituency: selectedConstituency,
                ward: selectedWard,
                coordinates: ward.ward_coordinates || undefined,
              })
              return
            }
          }
        }

        // If constituency is selected (but no ward), use constituency coordinates
        if (selectedConstituency && !selectedWard) {
          const constituency = county.constituencies.find(
            (c) => c.constituency_name === selectedConstituency
          )
          if (constituency) {
            onLocationChange({
              county: selectedCounty,
              constituency: selectedConstituency,
              ward: '',
              coordinates: constituency.constituency_coordinates || undefined,
            })
            return
          }
        }

        // If only county is selected, use county coordinates
        onLocationChange({
          county: selectedCounty,
          constituency: '',
          ward: '',
          coordinates: county.county_coordinates || undefined,
        })
      }
    }
  }, [
    selectedWard,
    selectedConstituency,
    selectedCounty,
    onLocationChange,
    counties,
  ])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </Label>
          <div className="text-sm text-muted-foreground">
            Loading locations...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Location
      </Label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* County Selection */}
        <div className="space-y-2">
          <Label htmlFor="county">County *</Label>
          <Select
            value={selectedCounty}
            onValueChange={(value) => {
              setSelectedCounty(value)
              setSelectedConstituency('')
              setSelectedWard('')
              setConstituencies([])
              setWards([])
            }}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select County" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Properties</SelectItem>
              {counties.map((county) => (
                <SelectItem key={county.county_code} value={county.county_name}>
                  {county.county_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Constituency Selection */}
        <div className="space-y-2">
          <Label htmlFor="constituency">Constituency *</Label>
          <Select
            value={selectedConstituency}
            onValueChange={(value) => {
              setSelectedConstituency(value)
              setSelectedWard('')
              setWards([])
            }}
            disabled={!selectedCounty || selectedCounty === 'all'}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Constituency" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {constituencies.map((constituency, index) => (
                <SelectItem key={index} value={constituency.constituency_name}>
                  {constituency.constituency_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ward Selection */}
        <div className="space-y-2">
          <Label htmlFor="ward">Ward *</Label>
          <Select
            value={selectedWard}
            onValueChange={setSelectedWard}
            disabled={!selectedConstituency || selectedCounty === 'all'}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Ward" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {wards.map((ward, index) => (
                <SelectItem key={index} value={ward.ward_name}>
                  {ward.ward_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Location Display */}
      {selectedCounty === 'all' && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium text-foreground">
            Showing: All Properties
          </div>
          <div className="text-sm text-muted-foreground">
            No location filter applied
          </div>
        </div>
      )}
      {selectedCounty && selectedCounty !== 'all' && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium text-foreground">
            Filtering by:
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedWard && selectedConstituency
              ? `${selectedWard}, ${selectedConstituency}, ${selectedCounty}`
              : selectedConstituency
              ? `${selectedConstituency}, ${selectedCounty}`
              : selectedCounty}
          </div>
        </div>
      )}
    </div>
  )
}
