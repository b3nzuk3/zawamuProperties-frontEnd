import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { X } from 'lucide-react'

const allFeatures = ['Pool', 'Garage', 'Garden', 'Gym', 'Fireplace']
const allTypes = [
  'Maisonette',
  'Apartment',
  'Bungalow',
  'Townhouse',
  'Land',
  'Office space',
]

export default function AdminProperties() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [editProperty, setEditProperty] = useState<any | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    api
      .get('/properties')
      .then((res) => setProperties(res.data))
      .catch(() => setError('Failed to load properties'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this property?'))
      return
    setDeletingId(id)
    try {
      await api.delete(`/properties/${id}`)
      setProperties((props) => props.filter((p) => p._id !== id))
    } catch {
      alert('Failed to delete property')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = properties.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (property: any) => {
    setEditProperty({ ...property })
    setEditModal(true)
    setEditError(null)
    setNewImageFiles([])
    setNewImagePreviews([])
  }

  const handleEditChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setEditProperty((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleEditFeature = (feature: string, checked: boolean) => {
    setEditProperty((prev: any) => ({
      ...prev,
      features: checked
        ? [...(prev.features || []), feature]
        : (prev.features || []).filter((f: string) => f !== feature),
    }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(
        0,
        10 - (editProperty?.images?.length || 0) - newImageFiles.length
      ) as File[]
      setNewImageFiles((prev) => [...prev, ...files])

      // Create previews for selected files
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setNewImagePreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeExistingImage = (index: number) => {
    setEditProperty((prev: any) => ({
      ...prev,
      images: (prev.images || []).filter((_: string, i: number) => i !== index),
    }))
  }

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index))
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEditSave = async () => {
    setEditLoading(true)
    setEditError(null)
    setUploadingImages(true)
    try {
      // Upload new images if any
      let newImageUrls: string[] = []
      if (newImageFiles.length > 0) {
        const formData = new FormData()
        newImageFiles.forEach((file) => formData.append('images', file))
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        newImageUrls = uploadRes.data.urls
      }

      // Merge existing images with new ones
      const allImages = [
        ...(editProperty.images || []),
        ...newImageUrls,
      ]

      await api.put(`/properties/${editProperty._id}`, {
        ...editProperty,
        price: Number(editProperty.price) || 0,
        bedrooms: editProperty.bedrooms ? Number(editProperty.bedrooms) : 0,
        bathrooms: editProperty.bathrooms ? Number(editProperty.bathrooms) : 0,
        area: editProperty.area ? Number(editProperty.area) : 0,
        features: editProperty.features || [],
        images: allImages,
      })
      setProperties((props) =>
        props.map((p) =>
          p._id === editProperty._id
            ? { ...editProperty, images: allImages }
            : p
        )
      )
      setEditModal(false)
      setNewImageFiles([])
      setNewImagePreviews([])
    } catch (err: any) {
      setEditError('Failed to update property')
    } finally {
      setEditLoading(false)
      setUploadingImages(false)
    }
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading font-bold text-3xl mb-6">
            Manage Properties
          </h1>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by title or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded px-3 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground text-center py-12">
              No properties found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[600px] bg-white">
                <thead>
                  <tr className="bg-secondary">
                    <th className="p-3 text-left">Image</th>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">Location</th>
                    <th className="p-3 text-left">Price</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((property) => (
                    <tr
                      key={property._id}
                      className="border-b hover:bg-secondary/40 transition-colors"
                    >
                      <td className="p-3">
                        <img
                          src={
                            property.images && property.images.length > 0
                              ? property.images[0]
                              : '/placeholder.jpg'
                          }
                          alt={property.title}
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                      </td>
                      <td className="p-3 font-medium">{property.title}</td>
                      <td className="p-3">{property.location}</td>
                      <td className="p-3">
                        KSh {property.price.toLocaleString()}
                      </td>
                      <td className="p-3 space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(property)}
                          className="rounded-full px-4"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(property._id)}
                          disabled={deletingId === property._id}
                          className="rounded-full px-4"
                        >
                          {deletingId === property._id
                            ? 'Deleting...'
                            : 'Delete'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Edit Modal */}
          {editModal && editProperty && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button
                  className="absolute top-4 right-4 text-2xl text-muted-foreground hover:text-foreground"
                  onClick={() => setEditModal(false)}
                >
                  ×
                </button>
                <h2 className="font-heading text-2xl font-bold mb-6 text-center">
                  Edit Property
                </h2>
                {editError && (
                  <div className="text-red-500 mb-2">{editError}</div>
                )}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-accent">
                      Title
                    </label>
                    <input
                      name="title"
                      value={editProperty.title}
                      onChange={handleEditChange}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-accent">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editProperty.description}
                      onChange={handleEditChange}
                      className="border rounded px-3 py-2 w-full min-h-[80px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-accent">
                        Price
                      </label>
                      <input
                        name="price"
                        type="number"
                        value={editProperty.price}
                        onChange={handleEditChange}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-accent">
                        Location
                      </label>
                      <input
                        name="location"
                        value={editProperty.location}
                        onChange={handleEditChange}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-accent">
                        Type
                      </label>
                      <select
                        name="type"
                        value={editProperty.type}
                        onChange={handleEditChange}
                        className="border rounded px-3 py-2 w-full"
                      >
                        {allTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-accent">
                        Bedrooms
                      </label>
                      <input
                        name="bedrooms"
                        type="number"
                        value={editProperty.bedrooms}
                        onChange={handleEditChange}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-accent">
                        Bathrooms
                      </label>
                      <input
                        name="bathrooms"
                        type="number"
                        value={editProperty.bathrooms}
                        onChange={handleEditChange}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-accent">
                        Area (sqft)
                      </label>
                      <input
                        name="area"
                        type="number"
                        value={editProperty.area}
                        onChange={handleEditChange}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-accent">
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
                            checked={editProperty.features?.includes(feature)}
                            onChange={(e) =>
                              handleEditFeature(feature, e.target.checked)
                            }
                          />
                          <span>{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={editProperty.featured || false}
                        onChange={handleEditChange}
                      />
                      <span className="text-sm font-medium text-accent">Mark as Featured</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-accent">
                      Images
                    </label>
                    {/* Existing Images */}
                    {editProperty.images && editProperty.images.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Current Images:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {editProperty.images.map((img: string, idx: number) => (
                            <div key={idx} className="relative group">
                              <img
                                src={img}
                                alt={`Property ${idx + 1}`}
                                className="w-24 h-24 object-cover rounded-md border"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* New Image Upload */}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      disabled={
                        (editProperty?.images?.length || 0) +
                          newImageFiles.length >=
                        10
                      }
                      className="mb-2"
                    />
                    {/* New Image Previews */}
                    {newImagePreviews.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          New Images:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {newImagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={preview}
                                alt="Preview"
                                className="w-24 h-24 object-cover rounded-md border"
                              />
                              <button
                                type="button"
                                onClick={() => removeNewImage(idx)}
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
                  <Button
                    onClick={handleEditSave}
                    disabled={editLoading || uploadingImages}
                    className="w-full mt-4 text-lg py-3"
                  >
                    {editLoading || uploadingImages
                      ? 'Saving...'
                      : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
