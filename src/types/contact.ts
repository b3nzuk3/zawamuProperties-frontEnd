export type EnquirySource = 'general' | 'property'
export type EnquiryStatus = 'new' | 'read' | 'resolved'
export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'failed'

export interface EnquirySubmission {
  name: string
  email: string
  message: string
  phone?: string
  subject?: string
  interest?: string
  source: EnquirySource
  propertyId?: string
}

export interface EnquiryNotification {
  status?: NotificationStatus
  attempts?: number
  lastAttemptAt?: string | null
  lastError?: string | null
}

export interface Enquiry {
  _id: string
  name: string
  email: string
  message: string
  phone?: string | null
  subject?: string | null
  interest?: string | null
  source?: EnquirySource | null
  propertyId?: string | { _id?: string; title?: string } | null
  propertyTitle?: string | null
  propertyUrl?: string | null
  status?: EnquiryStatus | null
  notification?: EnquiryNotification | null
  createdAt?: string | null
}

export interface EnquiryPageResponse {
  items: Enquiry[]
  total: number
  page: number
  limit: number
  pages: number
}
