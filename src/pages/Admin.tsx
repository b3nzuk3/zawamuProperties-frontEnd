import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import {
  BarChart3,
  Home,
  FileText,
  Settings,
  Users,
  TrendingUp,
  Plus,
  X,
  Trash2,
  Calendar,
  Bell,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LocationSelector } from '@/components/ui/location-selector'
import api from '@/lib/api'
import MdEditor from 'react-markdown-editor-lite'
import MarkdownIt from 'markdown-it'
import 'react-markdown-editor-lite/lib/index.css'

type StatCard = {
  title: string
  value: string | number
  change: string
  icon: any
}

function formatChange(pct: number) {
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct}%`
}

const mdParser = new MarkdownIt()

export default function Admin() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [statsCards, setStatsCards] = useState<StatCard[]>([])
  const [recent, setRecent] = useState<
    {
      action: string
      subject: string
      timestamp: string
    }[]
  >([])
  const [loadingDash, setLoadingDash] = useState(true)
  const [checkingAlerts, setCheckingAlerts] = useState(false)
  const [dashError, setDashError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    county: '',
    constituency: '',
    ward: '',
    coordinates: null as [number, number] | null,
    type: 'Maisonette',
    bedrooms: '',
    bathrooms: '',
    area: '',
    featured: false,
    images: [], // This will now only store final uploaded URLs
    features: [] as string[], // Added features state
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [postModal, setPostModal] = useState(false)
  const [postForm, setPostForm] = useState({
    title: '',
    category: '',
    readTime: '',
    image: null,
    imagePreview: '',
    content: '',
    author: '',
    date: '',
    featured: false,
  })
  const [postLoading, setPostLoading] = useState(false)
  const [postError, setPostError] = useState('')
  const [contentTab, setContentTab] = useState<'edit' | 'preview'>('edit')

  const handleInput = (e: any) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleLocationChange = (location: {
    county: string
    constituency: string
    ward: string
    coordinates?: [number, number]
  }) => {
    setForm((f) => ({
      ...f,
      county: location.county,
      constituency: location.constituency,
      ward: location.ward,
      coordinates: location.coordinates || null,
      location: `${location.ward}, ${location.constituency}, ${location.county}`, // Keep backward compatibility
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(
        0,
        10 - selectedFiles.length
      ) as File[]
      setSelectedFiles((prev) => [...prev, ...files])

      // Create previews for selected files
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeSelectedImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setUploading(true)

    try {
      // First, upload images if any are selected
      let imageUrls = []
      if (selectedFiles.length > 0) {
        const formData = new FormData()
        selectedFiles.forEach((file) => formData.append('images', file))
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrls = uploadRes.data.urls
      }

      // Then create the property with all image URLs
      await api.post('/properties', {
        ...form,
        price: Number(form.price) || 0,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : 0,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : 0,
        area: form.area ? Number(form.area) : 0,
        images: imageUrls,
        // Include structured location data
        county: form.county,
        constituency: form.constituency,
        ward: form.ward,
        coordinates: form.coordinates,
      })

      setSuccess('Property added successfully!')
      setShowAddModal(false)
      // Reset form
      setForm({
        title: '',
        description: '',
        price: '',
        location: '',
        county: '',
        constituency: '',
        ward: '',
        coordinates: null,
        type: 'Maisonette',
        bedrooms: '',
        bathrooms: '',
        area: '',
        featured: false,
        images: [],
        features: [],
      })
      setSelectedFiles([])
      setPreviews([])
      // Optionally, refresh property list here
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add property')
    } finally {
      setUploading(false)
    }
  }

  const handleCheckAlerts = async () => {
    setCheckingAlerts(true)
    try {
      const response = await api.get(
        '/saved-searches/admin/check-matches?hoursBack=24'
      )
      const { data } = response.data

      if (data.totalMatches > 0) {
        alert(
          `Found ${data.totalMatches} matches and sent ${
            data.emailResults.filter((r: any) => r.success).length
          } email alerts!`
        )
      } else {
        alert('No new property matches found for saved searches.')
      }
    } catch (error) {
      console.error('Error checking alerts:', error)
      alert('Error checking property alerts. Please try again.')
    } finally {
      setCheckingAlerts(false)
    }
  }

  const handlePostInput = (e: any) => {
    const { name, value, files } = e.target
    if (name === 'image') {
      const file = files[0]
      setPostForm((f) => ({
        ...f,
        image: file,
        imagePreview: file ? URL.createObjectURL(file) : '',
      }))
    } else {
      setPostForm((f) => ({ ...f, [name]: value }))
    }
  }

  const handleAddPost = async (e: any) => {
    e.preventDefault()
    setPostLoading(true)
    setPostError('')
    try {
      let imageUrl = ''
      if (postForm.image) {
        const formData = new FormData()
        formData.append('images', postForm.image)
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrl = res.data.urls[0]
      }
      await api.post('/blog', {
        title: postForm.title,
        category: postForm.category,
        readTime: postForm.readTime,
        image: imageUrl,
        content: postForm.content,
        author: postForm.author,
        date: postForm.date,
        featured: postForm.featured,
      })
      setPostModal(false)
      setPostForm({
        title: '',
        category: '',
        readTime: '',
        image: null,
        imagePreview: '',
        content: '',
        author: '',
        date: '',
        featured: false,
      })
      // Optionally refresh posts list here
    } catch (err) {
      setPostError('Failed to add post.')
    } finally {
      setPostLoading(false)
    }
  }

  const allFeatures = ['Pool', 'Garage', 'Garden', 'Gym', 'Fireplace']

  useEffect(() => {
    async function loadDashboard() {
      setLoadingDash(true)
      setDashError(null)
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/recent-activity'),
        ])
        const s = statsRes.data
        const cards: StatCard[] = [
          {
            title: 'Total Properties',
            value: s.totals.properties,
            change: `${formatChange(
              s.monthOverMonth.properties
            )} from last month`,
            icon: Home,
          },
          {
            title: 'Active Listings',
            value: s.totals.activeListings,
            change: `${formatChange(
              s.monthOverMonth.activeListings
            )} from last month`,
            icon: TrendingUp,
          },
          {
            title: 'Blog Posts',
            value: s.totals.blogPosts,
            change: `${formatChange(
              s.monthOverMonth.blogPosts
            )} from last month`,
            icon: FileText,
          },
          {
            title: 'Inquiries',
            value: s.totals.inquiries,
            change: `${formatChange(
              s.monthOverMonth.inquiries
            )} from last month`,
            icon: BarChart3,
          },
        ]
        setStatsCards(cards)
        setRecent(activityRes.data)
      } catch (err: any) {
        setDashError('Failed to load dashboard data')
      } finally {
        setLoadingDash(false)
      }
    }
    loadDashboard()
  }, [])

  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-heading font-bold text-3xl text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your properties, content, and site settings
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Property
              </Button>
              <Button variant="outline" onClick={() => setPostModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Post
              </Button>
            </div>
          </div>

          {/* Add Property Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-card w-full max-w-2xl max-h-[90vh] relative flex flex-col"
              >
                <button
                  type="button"
                  className="absolute top-4 right-4 z-10"
                  onClick={() => setShowAddModal(false)}
                >
                  <X />
                </button>
                <div className="p-6 pb-4">
                  <h2 className="font-heading text-xl font-bold mb-4">
                    Add Property
                  </h2>
                  {error && <div className="text-red-500 mb-2">{error}</div>}
                  {success && (
                    <div className="text-green-600 mb-2">{success}</div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-6">
                  <div className="space-y-4 pb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Title
                      </label>
                      <Input
                        name="title"
                        value={form.title}
                        onChange={handleInput}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <Textarea
                        name="description"
                        value={form.description}
                        onChange={handleInput}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Price
                        </label>
                        <Input
                          name="price"
                          type="number"
                          value={form.price}
                          onChange={handleInput}
                          required
                        />
                      </div>
                    </div>

                    {/* Location Selector */}
                    <LocationSelector
                      onLocationChange={handleLocationChange}
                      initialLocation={{
                        county: form.county,
                        constituency: form.constituency,
                        ward: form.ward,
                      }}
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Type
                        </label>
                        <select
                          name="type"
                          value={form.type}
                          onChange={handleInput}
                          className="w-full border rounded-md px-2 py-2"
                        >
                          <option>Maisonette</option>
                          <option>Apartment</option>
                          <option>Bungalow</option>
                          <option>Townhouse</option>
                          <option>Land</option>
                          <option>Office space</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="featured"
                        name="featured"
                        checked={form.featured}
                        onChange={handleInput}
                        className="h-4 w-4"
                      />
                      <label htmlFor="featured" className="text-sm font-medium">
                        Mark as Featured
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Bedrooms
                        </label>
                        <Input
                          name="bedrooms"
                          type="number"
                          value={form.bedrooms}
                          onChange={handleInput}
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Bathrooms
                        </label>
                        <Input
                          name="bathrooms"
                          type="number"
                          value={form.bathrooms}
                          onChange={handleInput}
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Area (sqft)
                        </label>
                        <Input
                          name="area"
                          type="number"
                          value={form.area}
                          onChange={handleInput}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Features
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allFeatures.map((feature) => (
                          <label
                            key={feature}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={form.features.includes(feature)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setForm((prev) => ({
                                    ...prev,
                                    features: [...prev.features, feature],
                                  }))
                                } else {
                                  setForm((prev) => ({
                                    ...prev,
                                    features: prev.features.filter(
                                      (f) => f !== feature
                                    ),
                                  }))
                                }
                              }}
                            />
                            <span>{feature}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Images (max 10)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        disabled={selectedFiles.length >= 10}
                      />

                      {/* Selected files preview */}
                      {previews.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">
                            Selected Images:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {previews.map((preview, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={preview}
                                  alt="Preview"
                                  className="w-24 h-24 object-cover rounded-md border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSelectedImage(idx)}
                                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fixed Submit Button */}
                <div className="p-6 pt-4 border-t bg-gray-50 rounded-b-xl">
                  <Button type="submit" className="w-full" disabled={uploading}>
                    {uploading ? 'Adding Property...' : 'Add Property'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Add Post Modal */}
          {postModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-lg relative">
                <button
                  className="absolute top-4 right-4 text-2xl text-muted-foreground hover:text-foreground"
                  onClick={() => setPostModal(false)}
                >
                  ×
                </button>
                <h2 className="font-heading text-2xl font-bold mb-6 text-center">
                  Add New Post
                </h2>
                {postError && (
                  <div className="text-red-500 mb-2">{postError}</div>
                )}
                <form className="space-y-5" onSubmit={handleAddPost}>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <input
                      name="title"
                      value={postForm.title}
                      onChange={handlePostInput}
                      className="border rounded px-3 py-2 w-full"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        Category
                      </label>
                      <input
                        name="category"
                        value={postForm.category}
                        onChange={handlePostInput}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        Read Time
                      </label>
                      <input
                        name="readTime"
                        value={postForm.readTime}
                        onChange={handlePostInput}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="e.g. 7 min read"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="post-featured"
                      name="featured"
                      checked={postForm.featured}
                      onChange={handlePostInput}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor="post-featured"
                      className="text-sm font-medium"
                    >
                      Mark as Featured
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Image
                    </label>
                    <input
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handlePostInput}
                      className="border rounded px-3 py-2 w-full"
                    />
                    {postForm.imagePreview && (
                      <img
                        src={postForm.imagePreview}
                        alt="Preview"
                        className="mt-2 w-32 h-20 object-cover rounded"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Content
                    </label>
                    <div className="border rounded">
                      <MdEditor
                        value={postForm.content}
                        style={{ height: '300px' }}
                        renderHTML={(text) => mdParser.render(text)}
                        onChange={({ text }) =>
                          setPostForm((f) => ({ ...f, content: text }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        Author
                      </label>
                      <input
                        name="author"
                        value={postForm.author}
                        onChange={handlePostInput}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        Date
                      </label>
                      <input
                        name="date"
                        type="date"
                        value={postForm.date}
                        onChange={handlePostInput}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={postLoading}
                    className="w-full mt-4 text-lg py-3"
                  >
                    {postLoading ? 'Adding...' : 'Add Post'}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Supabase Integration Notice */}
          {/* (Removed Supabase connection prompt) */}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loadingDash && statsCards.length === 0
              ? [...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6 animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-7 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))
              : statsCards.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <Card key={stat.title} className="property-card">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {stat.title}
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                              {stat.value}
                            </p>
                            <p className="text-sm text-success">
                              {stat.change}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                            <Icon className="h-6 w-6 text-accent" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Move Viewing Requests to top */}
                <Link to="/admin/viewing-requests" className="block">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <Calendar className="h-8 w-8 text-accent" />
                    <div>
                      <h3 className="font-medium text-foreground">
                        Viewing Requests
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage property viewing appointments
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Move Check Property Alerts next */}
                <button
                  onClick={handleCheckAlerts}
                  disabled={checkingAlerts}
                  className="w-full block text-left"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <Bell className="h-8 w-8 text-accent" />
                    <div>
                      <h3 className="font-medium text-foreground">
                        Check Property Alerts
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {checkingAlerts
                          ? 'Checking for new matches...'
                          : 'Send alerts for new matching properties'}
                      </p>
                    </div>
                  </div>
                </button>

                <Link to="/admin/properties" className="block">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <Home className="h-8 w-8 text-accent" />
                    <div>
                      <h3 className="font-medium text-foreground">
                        Manage Properties
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Add, edit, or remove property listings
                      </p>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/blog" className="block">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <FileText className="h-8 w-8 text-accent" />
                    <div>
                      <h3 className="font-medium text-foreground">
                        Manage Blog
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Create and edit blog posts
                      </p>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/settings" className="block">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <Settings className="h-8 w-8 text-accent" />
                    <div>
                      <h3 className="font-medium text-foreground">
                        Site Settings
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Configure homepage and site metadata
                      </p>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/analytics" className="block">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <BarChart3 className="h-8 w-8 text-accent" />
                    <div>
                      <h3 className="font-medium text-foreground">Analytics</h3>
                      <p className="text-sm text-muted-foreground">
                        View site performance and user metrics
                      </p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingDash && recent.length === 0 ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="h-4 bg-muted rounded w-2/3" />
                          <div className="h-3 bg-muted rounded w-1/3" />
                        </div>
                      </div>
                    ))
                  ) : recent.length > 0 ? (
                    recent.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">
                              {activity.action}:
                            </span>{' '}
                            {activity.subject}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No recent activity.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Removed demo notice */}
        </div>
      </div>
    </Layout>
  )
}
