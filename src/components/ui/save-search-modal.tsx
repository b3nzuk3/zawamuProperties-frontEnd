import React, { useEffect, useState } from 'react'
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
import { savedSearchApi } from '../../lib/savedSearchApi'
import {
  clearStoredSavedSearchSession,
  getStoredSavedSearchSession,
  isSavedSearchUnauthorized,
  savedSearchSessionConfig,
} from '../../lib/savedSearchApi'
import type { SavedSearchSession } from '../../lib/savedSearchApi'
import { summarizeSavedSearchCriteria } from '../../lib/savedSearch'
import type { SavedSearchCriteria } from '../../lib/savedSearch'
import { Bell, Save, X, Mail, ShieldCheck } from 'lucide-react'

interface SaveSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchCriteria: SavedSearchCriteria
}

interface SaveSearchForm {
  name: string
  description: string
  userEmail: string
  userName: string
  userPhone: string
  alertFrequency: 'immediate' | 'daily' | 'weekly'
  maxAlertsPerDay: number
  isActive: boolean
}

const initialFormData: SaveSearchForm = {
  name: '',
  description: '',
  userEmail: '',
  userName: '',
  userPhone: '',
  alertFrequency: 'daily',
  maxAlertsPerDay: 5,
  isActive: false,
}

export function SaveSearchModal({ open, onOpenChange, searchCriteria }: SaveSearchModalProps) {
  const [loading, setLoading] = useState(false)
  const [requestingLink, setRequestingLink] = useState(false)
  const [formData, setFormData] = useState<SaveSearchForm>(initialFormData)
  const [verifiedSession, setVerifiedSession] = useState<SavedSearchSession | null>(null)
  const [pendingEmail, setPendingEmail] = useState('')
  const [linkStatus, setLinkStatus] = useState<'idle' | 'requested' | 'error'>('idle')
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    const session = getStoredSavedSearchSession()
    setVerifiedSession(session)
    setPendingEmail('')
    setLinkStatus('idle')
    setFormData(initialFormData)
  }, [open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const session = getStoredSavedSearchSession()
    setVerifiedSession(session)
    const email = session?.email ?? formData.userEmail.trim()
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      userEmail: email,
      userName: formData.userName.trim(),
      userPhone: formData.userPhone.trim(),
      searchCriteria,
      alertSettings: {
        isActive: Boolean(session && formData.isActive),
        frequency: formData.alertFrequency,
        maxAlertsPerDay: formData.maxAlertsPerDay,
      },
    }

    try {
      const response = await savedSearchApi.post(
        '/saved-searches',
        payload,
        session ? savedSearchSessionConfig(session.token) : undefined,
      )
      if (session) {
        if (response.status !== 201) {
          throw new Error('The server did not confirm the saved search.')
        }
        const alertMessage = formData.isActive
          ? 'Your search was saved and alert consent was enabled for this search.'
          : 'Your search was saved. Email alerts remain off until you enable them for this search.'
        toast({ title: 'Search saved', description: alertMessage })
        onOpenChange(false)
        return
      }

      setPendingEmail(email)
      setLinkStatus('idle')
      toast({
        title: 'Search request received',
        description: 'Alerts are off until you verify email access and explicitly enable them per search.',
      })
    } catch (error) {
      if (isSavedSearchUnauthorized(error)) {
        clearStoredSavedSearchSession()
        setVerifiedSession(null)
      }
      toast({
        title: 'Unable to save search',
        description: 'Please try again. Email verification is required before this search can be managed.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestVerification = async () => {
    if (!pendingEmail || requestingLink) return
    setRequestingLink(true)
    setLinkStatus('idle')
    try {
      await savedSearchApi.post('/saved-searches/access-links', { email: pendingEmail })
      setLinkStatus('requested')
    } catch {
      setLinkStatus('error')
    } finally {
      setRequestingLink(false)
    }
  }

  const updateField = <K extends keyof SaveSearchForm>(field: K, value: SaveSearchForm[K]) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />Save your search
          </DialogTitle>
          <DialogDescription>
            Save these criteria. Email alerts stay off until you have verified access and enabled consent for this individual search.
          </DialogDescription>
        </DialogHeader>

        {pendingEmail ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted p-4">
              <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" />Search request received</div>
              <p className="mt-2 text-sm text-muted-foreground">Your search is pending email verification and alerts are inactive. Request a one-time link to manage this email's saved searches.</p>
            </div>
            <Button type="button" onClick={() => void handleRequestVerification()} disabled={requestingLink}>
              <Mail className="mr-2 h-4 w-4" />
              {requestingLink ? 'Requesting…' : 'Request verification email'}
            </Button>
            {linkStatus === 'requested' && <p role="status" className="text-sm text-muted-foreground">If an access link can be issued for this email, check its inbox. This response does not confirm access.</p>}
            {linkStatus === 'error' && <p role="alert" className="text-sm text-destructive">Could not submit the access-link request. Try again or request a link from the dashboard.</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="mb-1 text-sm font-medium text-foreground">Search criteria</div>
              <div className="text-sm text-muted-foreground">{summarizeSavedSearchCriteria(searchCriteria)}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Search Name *</Label>
              <Input id="name" placeholder="e.g., 3BR Apartments in Nairobi" value={formData.name} onChange={(event) => updateField('name', event.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="Add a description for this search…" value={formData.description} onChange={(event) => updateField('description', event.target.value)} rows={3} disabled={loading} />
            </div>

            <div className="space-y-4">
              <div className="text-sm font-medium">Your information</div>
              <div className="space-y-2">
                <Label htmlFor="userName">Full Name *</Label>
                <Input id="userName" placeholder="Your full name" value={formData.userName} onChange={(event) => updateField('userName', event.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address *</Label>
                {verifiedSession ? (
                  <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm" aria-label="Verified email address">{verifiedSession.email}</div>
                ) : (
                  <Input id="userEmail" type="email" autoComplete="email" placeholder="your.email@example.com" value={formData.userEmail} onChange={(event) => updateField('userEmail', event.target.value)} required disabled={loading} />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPhone">Phone number (optional)</Label>
                <Input id="userPhone" type="tel" placeholder="+254 700 000 000" value={formData.userPhone} onChange={(event) => updateField('userPhone', event.target.value)} disabled={loading} />
              </div>
            </div>

            {verifiedSession ? (
              <div className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-medium"><Bell className="h-4 w-4" />Alert settings for this search</div>
                <div className="flex items-center gap-2">
                  <Checkbox id="isActive" checked={formData.isActive} onCheckedChange={(checked) => updateField('isActive', checked === true)} disabled={loading} />
                  <Label htmlFor="isActive" className="text-sm">Enable email alerts for this search</Label>
                </div>
                {formData.isActive && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="alertFrequency">Alert frequency</Label>
                      <Select value={formData.alertFrequency} onValueChange={(value) => updateField('alertFrequency', value as SaveSearchForm['alertFrequency'])}>
                        <SelectTrigger id="alertFrequency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxAlertsPerDay">Maximum alerts per day</Label>
                      <Select value={String(formData.maxAlertsPerDay)} onValueChange={(value) => updateField('maxAlertsPerDay', Number(value))}>
                        <SelectTrigger id="maxAlertsPerDay"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 3, 5, 10, 20].map((count) => <SelectItem key={count} value={String(count)}>{count}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">Email alerts are disabled until you verify your email and explicitly enable them for this search.</p>
            )}

            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                <X className="mr-2 h-4 w-4" />Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save Search'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
