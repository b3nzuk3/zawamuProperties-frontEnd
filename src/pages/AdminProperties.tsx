import { useEffect, useRef, useState } from 'react'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { PropertyFields } from '@/components/properties/PropertyFields'
import api from '@/lib/api'
import { X } from 'lucide-react'
import type { Property, PropertyFormValues } from '@/types/property'
import {
  buildPropertyPayload,
  calculateEffectivePrice,
  propertyToForm,
  validatePropertyForm,
} from '@/lib/property'
import { getImageUrl } from '@/lib/media'

type PropertyApiError = {
  response?: {
    status?: number
    data?: { message?: string; error?: string }
  }
}

function getPropertySaveError(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null) return fallback
  const apiError = error as PropertyApiError
  if (apiError.response?.status === 409) {
    return 'This property changed on the server. Reload it before saving again.'
  }
  return apiError.response?.data?.error || apiError.response?.data?.message || fallback
}

function formatPrice(price: number, listingPurpose: string) {
  const suffix = listingPurpose === 'rent' ? ' / month' : ''
  return `KSh ${price.toLocaleString()}${suffix}`
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [editProperty, setEditProperty] = useState<Property | null>(null)
  const [editForm, setEditForm] = useState<PropertyFormValues | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [featureSaving, setFeatureSaving] = useState(false)
  const featureSavingRef = useRef(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [conflictedIds, setConflictedIds] = useState<Set<string>>(new Set())
  const [editorRevision, setEditorRevision] = useState(0)
  const [existingImages, setExistingImages] = useState<string[]>([])
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

  const handleFeatureBusyChange = (busy: boolean) => {
    featureSavingRef.current = busy
    setFeatureSaving(busy)
  }

  const closeEdit = () => {
    if (featureSavingRef.current || editLoading) return
    setEditModal(false)
  }

  const openEdit = (property: Property) => {
    if (editLoading || featureSavingRef.current) return
    setEditProperty(property)
    setEditForm(propertyToForm(property))
    setExistingImages(property.images || [])
    setEditModal(true)
    setEditError(null)
    setNewImageFiles([])
    setNewImagePreviews([])
  }

  const reloadLatest = async () => {
    if (!editProperty?._id || editLoading || featureSavingRef.current) return
    const id = editProperty._id
    setEditLoading(true)
    try {
      const response = await api.get(`/properties/${id}`)
      const latest = response.data as Property
      setEditProperty(latest)
      setEditForm(propertyToForm(latest))
      setExistingImages(latest.images || [])
      setNewImageFiles([])
      setNewImagePreviews([])
      setEditorRevision((revision) => revision + 1)
      setProperties((current) => current.map((property) => property._id === id ? latest : property))
      setConflictedIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
      setEditError(null)
    } catch {
      setEditError('Failed to reload property. Your unsaved edits are still here; retry reloading before saving.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editLoading || uploadingImages || featureSavingRef.current) return
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(
        0,
        10 - existingImages.length - newImageFiles.length
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
    if (editLoading || uploadingImages || featureSavingRef.current) return
    setExistingImages((images) => images.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    if (editLoading || uploadingImages || featureSavingRef.current) return
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index))
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEditSave = async () => {
    if (!editProperty || !editForm || editLoading || featureSavingRef.current || conflictedIds.has(editProperty._id)) return
    setEditError(null)
    const validationError = validatePropertyForm(editForm)
    if (validationError) {
      setEditError(validationError)
      return
    }
    setEditLoading(true)
    setUploadingImages(newImageFiles.length > 0)
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
      const allImages = [...existingImages, ...newImageUrls]
      const response = await api.put(
        `/properties/${editProperty._id}`,
        buildPropertyPayload(editForm, allImages)
      )
      const savedProperty = response.data as Property
      setProperties((props) =>
        props.map((property) =>
          property._id === editProperty._id ? savedProperty : property
        )
      )
      setEditModal(false)
      setEditProperty(null)
      setEditForm(null)
      setExistingImages([])
      setNewImageFiles([])
      setNewImagePreviews([])
    } catch (err: unknown) {
      if ((err as PropertyApiError)?.response?.status === 409 && editProperty._id) {
        setConflictedIds((current) => new Set(current).add(editProperty._id))
      }
      setEditError(getPropertySaveError(err, 'Failed to update property'))
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
              <table className="w-full min-w-[900px] bg-white">
                <thead>
                  <tr className="bg-secondary">
                    <th className="p-3 text-left">Image</th>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">Location</th>
                    <th className="p-3 text-left">Purpose</th>
                    <th className="p-3 text-left">Availability</th>
                    <th className="p-3 text-left">Price</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((property) => (
                    <tr key={property._id} className="border-b hover:bg-secondary/40 transition-colors">
                      <td className="p-3">
                        <img
                          src={getImageUrl(
                            property.images && property.images.length > 0
                              ? property.images[0]
                              : '/placeholder.jpg',
                            'thumbnail',
                          )}
                          alt={property.title}
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                      </td>
                      <td className="p-3 font-medium">{property.title}</td>
                      <td className="p-3">{property.location}</td>
                      <td className="p-3">
                        {property.listingPurpose === 'rent' ? 'For rent' : 'For sale'}
                      </td>
                      <td className="p-3 capitalize">
                        {property.availability || 'available'}
                      </td>
                      <td className="p-3">
                        {(() => {
                          const purpose = property.listingPurpose || 'sale'
                          const effectivePrice = property.effectivePrice !== undefined
                            ? property.effectivePrice
                            : calculateEffectivePrice(property.price, property.offerPercent ?? 0)
                          return (
                            <div>
                              <p>Base: {formatPrice(property.price, purpose)}</p>
                              {(property.offerPercent ?? 0) > 0 && effectivePrice !== null && (
                                <p className="text-sm text-muted-foreground">
                                  Effective: {formatPrice(effectivePrice, purpose)}
                                </p>
                              )}
                            </div>
                          )
                        })()}
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
          {editModal && editProperty && editForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button
                  type="button"
                  aria-label="Close Edit Property form"
                  className="absolute top-4 right-4 text-2xl text-muted-foreground hover:text-foreground"
                  disabled={editLoading || featureSaving}
                  onClick={closeEdit}
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
                  <PropertyFields
                    key={`${editProperty._id}-${editorRevision}`}
                    value={editForm}
                    onChange={setEditForm}
                    onFeatureBusyChange={handleFeatureBusyChange}
                    disabled={editLoading || featureSaving}
                  />
                  <div>
                    <label htmlFor="edit-property-images" className="block text-sm font-medium mb-1 text-accent">
                      Images
                    </label>
                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Current Images:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {existingImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={getImageUrl(img, 'thumbnail')}
                                alt={`Property ${idx + 1}`}
                                className="w-24 h-24 object-cover rounded-md border"
                              />
                              <button
                                type="button"
                                disabled={editLoading || uploadingImages || featureSaving}
                                aria-label={`Remove existing image ${idx + 1}`}
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
                      id="edit-property-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      disabled={
                        editLoading || uploadingImages || featureSaving || existingImages.length + newImageFiles.length >= 10
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
                                disabled={editLoading || uploadingImages || featureSaving}
                                aria-label={`Remove new image ${idx + 1}`}
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
                  {conflictedIds.has(editProperty._id) && (
                    <Button type="button" variant="outline" onClick={reloadLatest} disabled={editLoading || featureSaving}>
                      Reload latest (discard unsaved edits)
                    </Button>
                  )}
                  <Button
                    onClick={handleEditSave}
                    disabled={editLoading || uploadingImages || featureSaving || conflictedIds.has(editProperty._id)}
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
