import { useEffect, useId, useRef, useState } from 'react'
import api from '@/lib/api'

interface FeatureOption {
  _id: string
  name: string
}

interface FeatureSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  onBusyChange?: (busy: boolean) => void
  disabled?: boolean
}

function normalizedFeatureName(value: string): string {
  return value.trim().replace(/\s+/gu, ' ')
}

function featureKey(value: string): string {
  return normalizedFeatureName(value).toLowerCase()
}

export function FeatureSelect({ value, onChange, onBusyChange, disabled = false }: FeatureSelectProps) {
  const inputId = useId()
  const [features, setFeatures] = useState<FeatureOption[]>([])
  const [snapshotFeatures, setSnapshotFeatures] = useState<string[]>(() => [...value])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const mountedRef = useRef(false)
  const savingRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    api.get('/features')
      .then((response) => {
        if (!Array.isArray(response.data)) throw new Error('Invalid feature response')
        const received = response.data.filter((feature: unknown): feature is FeatureOption => {
          if (typeof feature !== 'object' || feature === null) return false
          const candidate = feature as Partial<FeatureOption>
          return typeof candidate._id === 'string' && typeof candidate.name === 'string'
        })
        if (active) setFeatures(received)
      })
      .catch(() => {
        if (active) setLoadError('Could not load features. Retry to try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [reloadKey])

  const snapshotOptions: FeatureOption[] = snapshotFeatures.map((name) => ({
    _id: `snapshot:${featureKey(name)}`,
    name,
  }))
  const optionMap = new Map<string, FeatureOption>()
  for (const feature of [...features, ...snapshotOptions]) {
    const key = featureKey(feature.name)
    if (key && !optionMap.has(key)) optionMap.set(key, feature)
  }
  const availableFeatures = [...optionMap.values()]
  const normalizedQuery = normalizedFeatureName(query)
  const queryKey = featureKey(query)
  const filteredFeatures = availableFeatures.filter((feature) =>
    normalizedFeatureName(feature.name).toLowerCase().includes(queryKey),
  )
  const duplicate = queryKey !== '' && availableFeatures.some((feature) => featureKey(feature.name) === queryKey)
  const tooLong = [...normalizedQuery].length > 100
  const canCreate = normalizedQuery.length > 0 && !duplicate

  const toggleFeature = (featureName: string) => {
    if (disabled || savingRef.current) return
    const key = featureKey(featureName)
    if (value.some((selected) => featureKey(selected) === key)) {
      onChange(value.filter((selected) => featureKey(selected) !== key))
    } else {
      onChange([...value, featureName])
    }
  }

  const removeFeature = (featureName: string) => {
    if (disabled || savingRef.current) return
    const key = featureKey(featureName)
    onChange(value.filter((selected) => featureKey(selected) !== key))
  }

  const handleCreate = async () => {
    if (disabled || saving || savingRef.current || !canCreate) return
    setCreateError(null)
    if (!normalizedQuery) return
    if (tooLong) {
      setCreateError('Feature names must be 100 characters or fewer.')
      return
    }

    savingRef.current = true
    setSaving(true)
    onBusyChange?.(true)
    try {
      const response = await api.post('/features', { name: normalizedQuery })
      const feature: unknown = response.data
      if (
        typeof feature !== 'object' || feature === null ||
        typeof (feature as Partial<FeatureOption>)._id !== 'string' ||
        typeof (feature as Partial<FeatureOption>).name !== 'string'
      ) throw new Error('Invalid feature response')

      if (!mountedRef.current) return
      const saved = feature as FeatureOption
      setFeatures((current) => current.some((existing) => existing._id === saved._id)
        ? current
        : [...current, saved])
      setSnapshotFeatures((current) => current.some((existing) => featureKey(existing) === featureKey(saved.name))
        ? current
        : [...current, saved.name])
      if (!value.some((selected) => featureKey(selected) === featureKey(saved.name))) {
        onChange([...value, saved.name])
      }
      setQuery('')
    } catch {
      if (mountedRef.current) {
        setCreateError('Could not save feature. Your entry is still here; retry when ready.')
      }
    } finally {
      savingRef.current = false
      if (mountedRef.current) {
        setSaving(false)
        onBusyChange?.(false)
      }
    }
  }

  return (
    <div className="space-y-3" aria-busy={saving}>
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
        Search or add a feature
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.currentTarget.value)
          setCreateError(null)
        }}
        disabled={disabled || saving}
        autoComplete="off"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {loading && <p role="status" className="text-sm text-muted-foreground">Loading features…</p>}
      {loadError && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            disabled={disabled || loading || saving}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            Retry loading features
          </button>
        </div>
      )}
      {!loading && !loadError && (
        <>
          <div role="listbox" aria-label="Available features" aria-multiselectable="true" className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-input p-1">
            {filteredFeatures.length > 0 ? filteredFeatures.map((feature) => {
              const selected = value.some((entry) => featureKey(entry) === featureKey(feature.name))
              return (
                <button
                  key={feature._id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={disabled || saving}
                  onClick={() => toggleFeature(feature.name)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <span>{feature.name}</span>
                  {selected && <span aria-hidden="true">Selected</span>}
                </button>
              )
            }) : (
              <p className="px-2 py-2 text-sm text-muted-foreground">No matching features.</p>
            )}
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={disabled || saving}
              className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
            >
              {saving ? 'Saving feature…' : `Add feature: ${normalizedQuery}`}
            </button>
          )}
        </>
      )}
      {loadError && canCreate && (
        <button
          type="button"
          onClick={handleCreate}
          disabled={disabled || saving}
          className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
        >
          {saving ? 'Saving feature…' : `Add feature: ${normalizedQuery}`}
        </button>
      )}
      {canCreate && tooLong && <p className="text-sm text-destructive">Feature names must be 100 characters or fewer.</p>}
      {createError && <p role="alert" className="text-sm text-destructive">{createError}</p>}

      <div>
        <p className="mb-1 text-sm font-medium text-foreground">Selected features</p>
        {value.length > 0 ? (
          <ul aria-label="Selected features" className="flex flex-wrap gap-2">
            {value.map((featureName, index) => (
              <li key={`${featureKey(featureName)}-${index}`} className="flex items-center gap-1 rounded-full border border-input px-2.5 py-1 text-sm">
                <span>{featureName}</span>
                <button
                  type="button"
                  aria-label={`Remove ${featureName}`}
                  onClick={() => removeFeature(featureName)}
                  disabled={disabled || saving}
                  className="rounded-full px-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No features selected.</p>
        )}
      </div>
    </div>
  )
}

export default FeatureSelect
