import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { SavedSearchesManager } from '../components/ui/saved-searches-manager'
import { savedSearchApi } from '../lib/savedSearchApi'
import {
  captureSavedSearchAccessLink,
  clearCapturedSavedSearchAccessLink,
  clearStoredSavedSearchSession,
  getStoredSavedSearchSession,
  isSavedSearchUnauthorized,
  savedSearchSessionConfig,
  storeSavedSearchSession,
} from '../lib/savedSearchApi'
import type { SavedSearchSession } from '../lib/savedSearchApi'
import { Mail, Search, ShieldCheck, LogOut } from 'lucide-react'

const MAX_TIMEOUT_MS = 2_147_483_647

function getConsumedSession(response: unknown): SavedSearchSession | null {
  if (!response || typeof response !== 'object') return null
  const body = (response as { data?: unknown }).data
  if (!body || typeof body !== 'object') return null
  const data = (body as { data?: unknown }).data
  if (!data || typeof data !== 'object') return null
  const session = data as Partial<SavedSearchSession>
  if (
    typeof session.token !== 'string' || !session.token ||
    typeof session.email !== 'string' || !session.email ||
    typeof session.expiresAt !== 'string' ||
    !Number.isFinite(Date.parse(session.expiresAt)) ||
    Date.parse(session.expiresAt) <= Date.now()
  ) return null
  return { token: session.token, email: session.email, expiresAt: session.expiresAt }
}

export default function UserDashboard() {
  const [session, setSession] = useState<SavedSearchSession | null>(() => getStoredSavedSearchSession())
  const [linkToken, setLinkToken] = useState<string | null>(() => captureSavedSearchAccessLink())
  const [email, setEmail] = useState('')
  const [requestStatus, setRequestStatus] = useState<'idle' | 'requesting' | 'requested' | 'error'>('idle')
  const [requestMessage, setRequestMessage] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmationError, setConfirmationError] = useState('')
  const [logoutWarning, setLogoutWarning] = useState('')
  const requestRevision = useRef(0)
  const confirmationRevision = useRef(0)
  const confirmationInFlight = useRef(false)
  const sessionRef = useRef(session)
  const emailRef = useRef(email)
  sessionRef.current = session
  emailRef.current = email

  useEffect(() => () => {
    requestRevision.current += 1
    confirmationRevision.current += 1
  }, [])

  const invalidateSession = useCallback((token: string) => {
    if (sessionRef.current?.token !== token) return
    confirmationRevision.current += 1
    clearStoredSavedSearchSession()
    setSession(null)
  }, [])

  useEffect(() => {
    if (!session) return
    const remaining = Date.parse(session.expiresAt) - Date.now()
    if (remaining <= 0) {
      invalidateSession(session.token)
      return
    }
    const expiresAt = Date.parse(session.expiresAt)
    let timeout: number | undefined
    const checkExpiry = () => {
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        invalidateSession(session.token)
        return
      }
      timeout = window.setTimeout(checkExpiry, Math.min(remaining, MAX_TIMEOUT_MS))
    }
    checkExpiry()
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout)
    }
  }, [session, invalidateSession])

  const handleEmailChange = (value: string) => {
    requestRevision.current += 1
    emailRef.current = value
    setEmail(value)
    setRequestStatus('idle')
    setRequestMessage('')
  }

  const handleRequestAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const requestedEmail = email.trim()
    if (!requestedEmail) return

    const revision = ++requestRevision.current
    setRequestStatus('requesting')
    setRequestMessage('')
    try {
      await savedSearchApi.post('/saved-searches/access-links', { email: requestedEmail })
      if (revision !== requestRevision.current || emailRef.current.trim() !== requestedEmail) return
      setRequestStatus('requested')
      setRequestMessage('If an access link can be issued for this email, check its inbox. This request does not confirm access.')
    } catch {
      if (revision !== requestRevision.current || emailRef.current.trim() !== requestedEmail) return
      setRequestStatus('error')
      setRequestMessage('We could not submit the access request. Please try again.')
    }
  }

  const handleConfirmAccess = async () => {
    if (!linkToken || confirmationInFlight.current) return
    confirmationInFlight.current = true
    const revision = ++confirmationRevision.current
    setConfirming(true)
    setConfirmationError('')
    try {
      const response = await savedSearchApi.post('/saved-searches/access-links/consume', { token: linkToken })
      if (revision !== confirmationRevision.current) return
      const consumedSession = getConsumedSession(response)
      if (!consumedSession) {
        setConfirmationError('This access link is invalid or expired. Request a new link from your email address.')
        return
      }
      storeSavedSearchSession(consumedSession)
      if (!getStoredSavedSearchSession()) {
        setConfirmationError('This access session has expired. Request a new access link.')
        return
      }
      clearCapturedSavedSearchAccessLink()
      setLinkToken(null)
      setSession(consumedSession)
      setLogoutWarning('')
    } catch (error) {
      if (revision !== confirmationRevision.current) return
      setConfirmationError(isSavedSearchUnauthorized(error)
        ? 'This access link is invalid or expired. Request a new link from your email address.'
        : 'We could not confirm this link. Please try again.')
    } finally {
      if (revision === confirmationRevision.current) {
        confirmationInFlight.current = false
        setConfirming(false)
      }
    }
  }

  const handleRequestAnotherLink = () => {
    confirmationRevision.current += 1
    clearCapturedSavedSearchAccessLink()
    setLinkToken(null)
    setConfirmationError('')
    setConfirming(false)
    confirmationInFlight.current = false
  }

  const handleLogout = () => {
    const currentSession = sessionRef.current
    const revision = ++confirmationRevision.current
    clearStoredSavedSearchSession()
    setSession(null)
    setLogoutWarning('')
    if (currentSession) {
      void savedSearchApi.delete('/saved-searches/session', savedSearchSessionConfig(currentSession.token)).catch(() => {
        if (revision === confirmationRevision.current) {
          setLogoutWarning('Local access is cleared, but we could not confirm server-side revocation. Any copied session token may remain valid until expiry. Reconnect and contact support if necessary.')
        }
      })
    }
  }

  const showLinkConfirmation = Boolean(linkToken)
  const showSession = Boolean(session && !showLinkConfirmation)

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <main className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Saved Searches</h1>
          <p className="mt-2 text-muted-foreground">Manage saved searches only after verifying access to their email address.</p>
        </header>

        {logoutWarning && <p role="alert" className="text-sm text-destructive">{logoutWarning}</p>}

        {showLinkConfirmation && (
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <CardTitle>Confirm your email access</CardTitle>
              <CardDescription>The one-time email link is ready. Confirm below to open a temporary saved-search session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {confirmationError && <p role="alert" className="text-sm text-destructive">{confirmationError}</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void handleConfirmAccess()} disabled={confirming}>
                  {confirming ? 'Confirming…' : 'Confirm email access'}
                </Button>
                <Button type="button" variant="outline" onClick={handleRequestAnotherLink}>
                  Request another access link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Opening this page alone does not grant access. The link token is not kept in the URL or browser storage.</p>
            </CardContent>
          </Card>
        )}

        {!showLinkConfirmation && !showSession && (
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <CardTitle>Request an access link</CardTitle>
              <CardDescription>Enter the email used for saved searches. Typing an address does not grant access; you must open and confirm its one-time verification link.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="access-email">Email address</Label>
                  <Input
                    id="access-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => handleEmailChange(event.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={requestStatus === 'requesting'}>
                  <Search className="mr-2 h-4 w-4" />
                  {requestStatus === 'requesting' ? 'Requesting…' : 'Email me a verification link'}
                </Button>
                {requestMessage && <p role={requestStatus === 'error' ? 'alert' : 'status'} className="text-sm text-muted-foreground">{requestMessage}</p>}
              </form>
            </CardContent>
          </Card>
        )}

        {showSession && session && (
          <>
            <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-muted-foreground">Verified email session</p>
                <p className="font-medium text-foreground">{session.email}</p>
                <p className="text-xs text-muted-foreground">Expires {new Date(session.expiresAt).toLocaleString()}</p>
              </div>
              <Button type="button" variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
            <SavedSearchesManager session={session} onSessionInvalid={invalidateSession} />
          </>
        )}
      </main>
    </div>
  )
}
