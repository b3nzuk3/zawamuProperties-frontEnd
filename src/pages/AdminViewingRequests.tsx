import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import {
  Calendar,
  User,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'

interface ViewingRequest {
  _id: string
  propertyId: {
    _id: string
    title: string
    location: string
    price: number
  }
  propertyTitle: string
  name: string
  email: string
  phone?: string
  preferredDate: string
  preferredTime: string
  message?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  createdAt: string
}

export default function AdminViewingRequests() {
  const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<ViewingRequest | null>(
    null
  )
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchViewingRequests()
  }, [])

  const fetchViewingRequests = async () => {
    try {
      setLoading(true)
      const response = await api.get('/viewing-requests')
      setViewingRequests(response.data)
    } catch (err) {
      setError('Failed to load viewing requests')
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (
    id: string,
    status: string,
    notes?: string
  ) => {
    try {
      await api.put(`/viewing-requests/${id}`, { status, notes })
      setViewingRequests((prev) =>
        prev.map((req) =>
          req._id === id
            ? { ...req, status: status as any, notes: notes || req.notes }
            : req
        )
      )
      setShowModal(false)
      setSelectedRequest(null)
      setAdminNotes('')
      toast({
        title: 'Status Updated',
        description: 'Viewing request status has been updated successfully.',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  const filteredRequests = viewingRequests.filter(
    (request) => statusFilter === 'all' || request.status === statusFilter
  )

  if (loading) {
    return (
      <Layout>
        <div className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">Loading viewing requests...</div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl text-foreground mb-4">
              Viewing Requests
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage property viewing appointments and requests
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No viewing requests found
                  </h3>
                  <p className="text-muted-foreground">
                    {statusFilter === 'all'
                      ? 'No viewing requests have been submitted yet.'
                      : `No ${statusFilter} viewing requests found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card
                  key={request._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg text-foreground">
                            {request.propertyTitle}
                          </h3>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{request.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{request.email}</span>
                          </div>
                          {request.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{request.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(request.preferredDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Clock className="h-4 w-4" />
                          <span>
                            Preferred time: {formatTime(request.preferredTime)}
                          </span>
                        </div>

                        {request.message && (
                          <p className="text-sm text-muted-foreground mb-3">
                            <strong>Message:</strong> {request.message}
                          </p>
                        )}

                        {request.notes && (
                          <p className="text-sm text-muted-foreground mb-3">
                            <strong>Admin Notes:</strong> {request.notes}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Submitted: {formatDate(request.createdAt)}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setAdminNotes(request.notes || '')
                            setShowModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Management Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-card p-6 w-full max-w-lg">
            <h2 className="font-heading text-xl font-bold mb-4">
              Manage Viewing Request
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">Property</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.propertyTitle}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Client Details
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.name} ({selectedRequest.email})
                </p>
                {selectedRequest.phone && (
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.phone}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Preferred Time
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedRequest.preferredDate)} at{' '}
                  {formatTime(selectedRequest.preferredTime)}
                </p>
              </div>

              {selectedRequest.message && (
                <div>
                  <h3 className="font-medium text-foreground mb-2">
                    Client Message
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.message}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Admin Notes
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this viewing request..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false)
                  setSelectedRequest(null)
                  setAdminNotes('')
                }}
              >
                Cancel
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() =>
                    updateRequestStatus(
                      selectedRequest._id,
                      'cancelled',
                      adminNotes
                    )
                  }
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    updateRequestStatus(
                      selectedRequest._id,
                      'confirmed',
                      adminNotes
                    )
                  }
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
