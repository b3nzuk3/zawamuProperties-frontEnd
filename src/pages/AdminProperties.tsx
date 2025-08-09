import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

const allFeatures = ['Pool', 'Garage', 'Garden', 'Gym', 'Fireplace']
const allTypes = ['House', 'Condo', 'Loft', 'Commercial', 'Land']

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

  const handleEditSave = async () => {
    setEditLoading(true)
    setEditError(null)
    try {
      await api.put(`/properties/${editProperty._id}`, {
        ...editProperty,
        price: Number(editProperty.price) || 0,
        bedrooms: editProperty.bedrooms ? Number(editProperty.bedrooms) : 0,
        bathrooms: editProperty.bathrooms ? Number(editProperty.bathrooms) : 0,
        area: editProperty.area ? Number(editProperty.area) : 0,
        features: editProperty.features || [],
      })
      setProperties((props) =>
        props.map((p) => (p._id === editProperty._id ? { ...editProperty } : p))
      )
      setEditModal(false)
    } catch (err: any) {
      setEditError('Failed to update property')
    } finally {
      setEditLoading(false)
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
                        ${property.price.toLocaleString()}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-lg relative">
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
                    <label className="block text-sm font-medium mb-1">
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
                    <label className="block text-sm font-medium mb-1">
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
                      <label className="block text-sm font-medium mb-1">
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
                      <label className="block text-sm font-medium mb-1">
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
                      <label className="block text-sm font-medium mb-1">
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
                      <label className="block text-sm font-medium mb-1">
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
                      <label className="block text-sm font-medium mb-1">
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
                      <label className="block text-sm font-medium mb-1">
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
                  <Button
                    onClick={handleEditSave}
                    disabled={editLoading}
                    className="w-full mt-4 text-lg py-3"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
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
