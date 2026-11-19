import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Mail, Phone, RefreshCw, UserRound } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/api'
import type { Enquiry, EnquiryPageResponse, EnquiryStatus } from '@/types/contact'

const PAGE_SIZE = 20
const statuses: EnquiryStatus[] = ['new', 'read', 'resolved']

type ApiError = { response?: { data?: { message?: string; error?: string } } }

function apiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const responseError = error as ApiError
    return responseError.response?.data?.message || responseError.response?.data?.error || fallback
  }
  return fallback
}

function enquiryStatus(enquiry: Enquiry): EnquiryStatus {
  return statuses.includes(enquiry.status as EnquiryStatus) ? enquiry.status as EnquiryStatus : 'new'
}

function notificationSummary(enquiry: Enquiry) {
  const notification = enquiry.notification ?? {}
  const attempts = Number.isFinite(notification.attempts) && (notification.attempts ?? 0) >= 0
    ? notification.attempts ?? 0
    : 0
  const status = ['pending', 'sending', 'sent', 'failed'].includes(notification.status ?? '')
    ? notification.status ?? 'pending'
    : 'pending'
  return { status, attempts, lastAttemptAt: notification.lastAttemptAt, lastError: notification.lastError }
}

function displayDate(value?: string | null) {
  if (!value) return 'Date unavailable'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? 'Date unavailable'
    : parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function propertyHref(enquiry: Enquiry) {
  const propertyId = typeof enquiry.propertyId === 'string'
    ? enquiry.propertyId
    : enquiry.propertyId && typeof enquiry.propertyId === 'object'
      ? enquiry.propertyId._id
      : null
  if (typeof propertyId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(propertyId)) {
    return `/listings/${encodeURIComponent(propertyId)}`
  }

  if (typeof enquiry.propertyUrl !== 'string' || !enquiry.propertyUrl) return null
  try {
    const url = new URL(enquiry.propertyUrl, window.location.origin)
    if (url.origin !== window.location.origin || !/^\/listings\/[A-Za-z0-9_-]{1,128}\/?$/.test(url.pathname)) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export default function AdminEnquiries() {
  const [items, setItems] = useState<Enquiry[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [listRevision, setListRevision] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'general' | 'property'>('all')
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<{ id: string; kind: 'status' | 'retry' } | null>(null)

  const listRequestId = useRef(0)
  const detailRequestId = useRef(0)
  const mutationRequestId = useRef(0)
  const selectedIdRef = useRef<string | null>(null)
  const mutationLock = useRef(false)

  useEffect(() => {
    const requestId = ++listRequestId.current
    let active = true
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE }
    if (statusFilter !== 'all') params.status = statusFilter
    if (sourceFilter !== 'all') params.source = sourceFilter

    setListLoading(true)
    setListError(null)
    setItems([])
    setTotal(0)
    setPages(1)

    api.get('/contact', { params })
      .then((response) => {
        if (!active || listRequestId.current !== requestId) return
        const data = response.data as EnquiryPageResponse
        const responsePages = Math.max(Number.isFinite(data?.pages) ? data.pages : 0, 1)
        const responsePage = Number.isFinite(data?.page) && data.page > 0 ? data.page : page
        if (responsePage > responsePages || page > responsePages) {
          setPage(responsePages)
          return
        }
        setItems(Array.isArray(data?.items) ? data.items : [])
        setTotal(Number.isFinite(data?.total) ? data.total : 0)
        setPages(responsePages)
        setPage(responsePage)
      })
      .catch((error: unknown) => {
        if (active && listRequestId.current === requestId) {
          setListError(apiErrorMessage(error, 'Failed to load enquiries. Please try again.'))
        }
      })
      .finally(() => {
        if (active && listRequestId.current === requestId) setListLoading(false)
      })

    return () => { active = false }
  }, [page, sourceFilter, statusFilter, listRevision])

  useEffect(() => {
    const requestId = ++detailRequestId.current
    let active = true
    if (!selectedId) {
      setSelectedEnquiry(null)
      setDetailLoading(false)
      setDetailError(null)
      return
    }

    setSelectedEnquiry(null)
    setDetailLoading(true)
    setDetailError(null)
    setActionMessage(null)
    setActionError(null)

    api.get(`/contact/${encodeURIComponent(selectedId)}`)
      .then((response) => {
        if (active && detailRequestId.current === requestId && selectedIdRef.current === selectedId) {
          setSelectedEnquiry(response.data as Enquiry)
        }
      })
      .catch((error: unknown) => {
        if (active && detailRequestId.current === requestId && selectedIdRef.current === selectedId) {
          setDetailError(apiErrorMessage(error, 'Failed to load this enquiry.'))
        }
      })
      .finally(() => {
        if (active && detailRequestId.current === requestId && selectedIdRef.current === selectedId) {
          setDetailLoading(false)
        }
      })

    return () => { active = false }
  }, [selectedId])

  const clearSelection = () => {
    listRequestId.current++
    selectedIdRef.current = null
    detailRequestId.current++
    setSelectedId(null)
    setSelectedEnquiry(null)
    setDetailError(null)
    setActionMessage(null)
    setActionError(null)
  }

  const changeStatusFilter = (value: 'all' | EnquiryStatus) => {
    clearSelection()
    setStatusFilter(value)
    setPage(1)
  }

  const changeSourceFilter = (value: 'all' | 'general' | 'property') => {
    clearSelection()
    setSourceFilter(value)
    setPage(1)
  }

  const openEnquiry = (id: string) => {
    if (selectedIdRef.current === id) return
    selectedIdRef.current = id
    setSelectedId(id)
    setSelectedEnquiry(null)
    setDetailError(null)
    setActionMessage(null)
    setActionError(null)
  }

  const runMutation = async (kind: 'status' | 'retry', id: string, status?: EnquiryStatus) => {
    if (mutationLock.current) return
    mutationLock.current = true
    const requestId = ++mutationRequestId.current
    setBusyAction({ id, kind })
    setActionMessage(null)
    setActionError(null)
    try {
      const response = kind === 'status'
        ? await api.patch(`/contact/${encodeURIComponent(id)}`, { status })
        : await api.post(`/contact/${encodeURIComponent(id)}/retry-notification`)
      const updated = response.data as Enquiry
      // Counts, filters and page membership are authoritative on the server.
      listRequestId.current++
      setListRevision((current) => current + 1)
      if (mutationRequestId.current === requestId && selectedIdRef.current === id) {
        setSelectedEnquiry(updated)
        setActionMessage(kind === 'status'
          ? 'Enquiry status updated.'
          : 'Notification retry processed. Check the delivery status below.')
      }
    } catch (error) {
      if (mutationRequestId.current === requestId && selectedIdRef.current === id) {
        setActionError(apiErrorMessage(error, kind === 'status'
          ? 'Could not update the enquiry status.'
          : 'Could not retry the notification.'))
      }
    } finally {
      if (mutationRequestId.current === requestId) {
        mutationLock.current = false
        setBusyAction(null)
      }
    }
  }

  const selectStatus = (status: EnquiryStatus) => {
    if (!selectedEnquiry || enquiryStatus(selectedEnquiry) === status) return
    void runMutation('status', selectedEnquiry._id, status)
  }

  const retryNotification = () => {
    if (!selectedEnquiry) return
    const notification = notificationSummary(selectedEnquiry)
    if (notification.status === 'sent' || notification.status === 'sending' || notification.attempts >= 5) return
    void runMutation('retry', selectedEnquiry._id)
  }

  const selectedNotification = selectedEnquiry ? notificationSummary(selectedEnquiry) : null
  const selectedPropertyHref = selectedEnquiry ? propertyHref(selectedEnquiry) : null
  const retryDisabled = !selectedEnquiry || !selectedNotification ||
    selectedNotification.status === 'sent' || selectedNotification.status === 'sending' ||
    selectedNotification.attempts >= 5 || busyAction !== null

  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <header>
            <h1 className="font-heading text-3xl font-bold text-foreground">Enquiries</h1>
            <p className="mt-2 text-muted-foreground">Review public messages and notification delivery status.</p>
          </header>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="enquiry-status-filter">Status</label>
              <select id="enquiry-status-filter" value={statusFilter} onChange={(event) => changeStatusFilter(event.target.value as 'all' | EnquiryStatus)} className="h-10 min-w-44 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All statuses</option>
                {statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="enquiry-source-filter">Source</label>
              <select id="enquiry-source-filter" value={sourceFilter} onChange={(event) => changeSourceFilter(event.target.value as 'all' | 'general' | 'property')} className="h-10 min-w-44 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All sources</option>
                <option value="general">General</option>
                <option value="property">Property</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <section aria-label="Enquiry results" aria-busy={listLoading}>
              {listLoading ? (
                <p className="py-12 text-center text-muted-foreground" role="status">Loading enquiries...</p>
              ) : listError ? (
                <Card><CardContent className="p-6"><p className="text-sm text-destructive" role="alert">{listError}</p></CardContent></Card>
              ) : items.length === 0 ? (
                <Card><CardContent className="p-8 text-center">
                  <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">No enquiries found</h2>
                  <p className="mt-1 text-sm text-muted-foreground">New public messages will appear here.</p>
                </CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <Card key={item._id} className={selectedId === item._id ? 'border-primary' : undefined}>
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate font-semibold text-foreground">{item.name || 'Unknown sender'}</h2>
                            <p className="break-all text-sm text-muted-foreground">{item.email || 'No email provided'}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="secondary">{item.source === 'property' ? 'Property' : 'General'}</Badge>
                              <Badge variant="outline">{enquiryStatus(item)}</Badge>
                              {item.propertyTitle && <span className="text-sm text-muted-foreground">{item.propertyTitle}</span>}
                            </div>
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.subject || item.message || 'No message provided'}</p>
                            <p className="mt-2 text-xs text-muted-foreground">{displayDate(item.createdAt)}</p>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => openEnquiry(item._id)} aria-label={`Open enquiry from ${item.name || 'unknown sender'}`}>
                            View details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-sm text-muted-foreground">{total} {total === 1 ? 'enquiry' : 'enquiries'} · Page {page} of {pages}</p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={page <= 1 || listLoading} onClick={() => { clearSelection(); setPage((current) => Math.max(1, current - 1)) }}>Previous</Button>
                      <Button type="button" variant="outline" size="sm" disabled={page >= pages || listLoading} onClick={() => { clearSelection(); setPage((current) => Math.min(pages, current + 1)) }}>Next</Button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section aria-label="Enquiry detail" aria-live="polite">
              {!selectedId ? (
                <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Select an enquiry to view its full message and manage it.</CardContent></Card>
              ) : detailLoading ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground" role="status">Loading enquiry details...</CardContent></Card>
              ) : detailError ? (
                <Card><CardContent className="p-6"><p role="alert" className="text-sm text-destructive">{detailError}</p></CardContent></Card>
              ) : selectedEnquiry && selectedNotification ? (
                <Card>
                  <CardHeader><CardTitle>Enquiry details</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">{selectedEnquiry.source === 'property' ? 'Property enquiry' : 'General enquiry'}</Badge>
                        <Badge variant="outline">{enquiryStatus(selectedEnquiry)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Received: {displayDate(selectedEnquiry.createdAt)}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-muted-foreground" />{selectedEnquiry.name || 'Unknown sender'}</p>
                      <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a className="break-all text-primary underline" href={`mailto:${selectedEnquiry.email}`}>{selectedEnquiry.email || 'No email provided'}</a></p>
                      {selectedEnquiry.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><a href={`tel:${selectedEnquiry.phone}`}>{selectedEnquiry.phone}</a></p>}
                      {selectedEnquiry.interest && <p><span className="font-medium">Interest:</span> {selectedEnquiry.interest}</p>}
                      {selectedEnquiry.subject && <p><span className="font-medium">Subject:</span> {selectedEnquiry.subject}</p>}
                    </div>

                    {(selectedEnquiry.propertyTitle || selectedPropertyHref) && (
                      <div className="rounded-lg border border-border p-4">
                        <h3 className="font-medium">Property context</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{selectedEnquiry.propertyTitle || 'Linked listing'}</p>
                        {selectedPropertyHref && <a href={selectedPropertyHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary underline">View property listing</a>}
                      </div>
                    )}

                    <div>
                      <h3 className="mb-2 font-medium">Message</h3>
                      <p className="whitespace-pre-wrap break-words rounded-lg bg-secondary/40 p-4 text-sm text-foreground">{selectedEnquiry.message || 'No message provided.'}</p>
                    </div>

                    <div>
                      <h3 className="mb-2 font-medium">Status</h3>
                      <div className="flex flex-wrap gap-2">
                        {statuses.map((status) => (
                          <Button key={status} type="button" size="sm" variant={enquiryStatus(selectedEnquiry) === status ? 'default' : 'outline'} disabled={busyAction !== null || enquiryStatus(selectedEnquiry) === status} onClick={() => selectStatus(status)}>
                            {status[0].toUpperCase() + status.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-medium">Email notification</h3>
                          <p className="mt-1 text-sm text-muted-foreground">Status: <span className="font-medium text-foreground">{selectedNotification.status}</span></p>
                          <p className="text-sm text-muted-foreground">Attempts: {selectedNotification.attempts} of 5</p>
                          {selectedNotification.lastAttemptAt && <p className="text-sm text-muted-foreground">Last attempt: {displayDate(selectedNotification.lastAttemptAt)}</p>}
                        </div>
                        <Button type="button" variant="outline" disabled={retryDisabled} onClick={retryNotification}>
                          <RefreshCw className="mr-2 h-4 w-4" />{busyAction?.id === selectedEnquiry._id && busyAction.kind === 'retry' ? 'Retrying...' : 'Retry notification'}
                        </Button>
                      </div>
                      {selectedNotification.lastError && <p className="mt-3 flex gap-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{selectedNotification.lastError}</p>}
                    </div>

                    {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
                    {actionMessage && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{actionMessage}</p>}
                  </CardContent>
                </Card>
              ) : (
                <Card><CardContent className="p-8 text-center text-muted-foreground">Enquiry details are unavailable.</CardContent></Card>
              )}
            </section>
          </div>
        </div>
      </div>
    </Layout>
  )
}
