import { useId, useRef, useState } from 'react'
import { AlertCircle, CheckCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'
import type { EnquirySource, EnquirySubmission } from '@/types/contact'

type EnquiryFormProps = {
  source?: EnquirySource
  propertyId?: string
  propertyTitle?: string
}

type FormValues = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  interest: string
}

const emptyForm: FormValues = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  interest: '',
}

const interests = [
  ['buying', 'Buying a Home'],
  ['selling', 'Selling a Home'],
  ['renting', 'Renting'],
  ['investment', 'Investment Property'],
  ['commercial', 'Commercial Real Estate'],
  ['other', 'Other'],
] as const

type ApiError = {
  response?: { data?: { message?: string; error?: string } }
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const responseError = error as ApiError
    const message = responseError.response?.data?.message || responseError.response?.data?.error
    if (message) return message
  }
  return 'We could not submit your enquiry. Please try again.'
}

export default function EnquiryForm({
  source = 'general',
  propertyId,
  propertyTitle,
}: EnquiryFormProps) {
  const [values, setValues] = useState<FormValues>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const formId = useId()

  const update = (field: keyof FormValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }))
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current) return
    if (source === 'property' && !propertyId) {
      setError('This listing cannot accept an enquiry right now. Please contact us instead.')
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const payload: EnquirySubmission = {
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
      source,
      ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
      ...(values.subject.trim() ? { subject: values.subject.trim() } : {}),
      ...(values.interest ? { interest: values.interest } : {}),
      ...(source === 'property' && propertyId ? { propertyId } : {}),
    }

    try {
      const response = await api.post('/contact', payload)
      if (response.data?.received !== true) {
        setError('We could not confirm that your enquiry was received. Please try again.')
        return
      }

      setValues(emptyForm)
      setSuccess(
        typeof response.data.message === 'string' && response.data.message.trim()
          ? response.data.message
          : 'Your enquiry has been received.',
      )
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const labelClass = 'mb-2 block text-sm font-medium text-foreground'
  const sourceLabel = source === 'property' ? 'property enquiry' : 'general enquiry'

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label={sourceLabel}>
      {source === 'property' && (
        <div className="rounded-lg border border-border bg-secondary/30 p-4" data-testid="enquiry-property-context">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Property enquiry</p>
          <p className="mt-1 font-semibold text-foreground">{propertyTitle || 'Selected property'}</p>
          <p className="mt-1 text-sm text-muted-foreground">Your message will be linked to this listing.</p>
        </div>
      )}

      <fieldset disabled={submitting} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${formId}-name`}>Full name *</label>
          <Input
            id={`${formId}-name`}
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Your full name"
            required
            maxLength={120}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${formId}-email`}>Email address *</label>
          <Input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="you@example.com"
            required
            maxLength={254}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${formId}-phone`}>Phone number <span className="text-muted-foreground">(optional)</span></label>
          <Input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            placeholder="0711168716"
            maxLength={40}
          />
        </div>
        {source === 'general' && (
          <div>
            <label className={labelClass} htmlFor={`${formId}-interest`}>Property interest</label>
            <select
              id={`${formId}-interest`}
              name="interest"
              value={values.interest}
              onChange={(event) => update('interest', event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select an interest (optional)</option>
              {interests.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor={`${formId}-subject`}>Subject *</label>
        <Input
          id={`${formId}-subject`}
          name="subject"
          value={values.subject}
          onChange={(event) => update('subject', event.target.value)}
          placeholder={source === 'property' ? 'What would you like to know about this property?' : "What's this regarding?"}
          required
          maxLength={160}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor={`${formId}-message`}>Message *</label>
        <Textarea
          id={`${formId}-message`}
          name="message"
          rows={5}
          value={values.message}
          onChange={(event) => update('message', event.target.value)}
          placeholder={source === 'property' ? 'Ask us about this listing...' : 'Tell us how we can help...'}
          required
          maxLength={5000}
        />
      </div>

      </fieldset>

      {error && (
        <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </p>
      )}
      {success && (
        <p className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400" role="status">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />{success}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full" size="lg">
        {submitting ? (
          <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current" />Submitting...</>
        ) : (
          <><Send className="mr-2 h-5 w-5" />Send enquiry</>
        )}
      </Button>
    </form>
  )
}
