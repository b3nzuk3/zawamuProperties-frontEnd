import type { PropertyFormValues, PropertyPurpose } from '@/types/property'
import {
  calculateEffectivePrice,
  isAvailabilityCompatible,
  RENTAL_PROPERTY_TYPES,
  SALE_PROPERTY_TYPES,
} from '@/lib/property'
import { FeatureSelect } from './FeatureSelect'

export interface PropertyFieldsProps {
  value: PropertyFormValues
  onChange: (next: PropertyFormValues) => void
  onFeatureBusyChange?: (busy: boolean) => void
  disabled?: boolean
}

const inputClassName = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
const labelClassName = 'mb-1 block text-sm font-medium text-foreground'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function PropertyFields({ value, onChange, onFeatureBusyChange, disabled = false }: PropertyFieldsProps) {
  const allowedTypes = value.listingPurpose === 'rent' ? RENTAL_PROPERTY_TYPES : SALE_PROPERTY_TYPES
  const compatible = isAvailabilityCompatible(value.listingPurpose, value.availability)
  const availableOptions = value.listingPurpose === 'rent'
    ? ['available', 'rented'] as const
    : ['available', 'sold'] as const
  const incompatibilityMessage = compatible
    ? null
    : `${titleCase(value.availability)} is not compatible with ${value.listingPurpose === 'rent' ? 'For Rent' : 'For Sale'}. Choose ${value.listingPurpose === 'rent' ? 'Available or Rented' : 'Available or Sold'} before saving.`
  const price = value.price.trim() === '' ? Number.NaN : Number(value.price)
  const offerPercent = value.offerPercent.trim() === '' ? Number.NaN : Number(value.offerPercent)
  const effectivePrice = calculateEffectivePrice(price, offerPercent)
  const priceLabel = value.listingPurpose === 'rent' ? 'Monthly rent (KES)' : 'Sale price (KES)'

  const update = <K extends keyof PropertyFormValues>(field: K, next: PropertyFormValues[K]) => {
    onChange({ ...value, [field]: next })
  }

  const changePurpose = (nextPurpose: PropertyPurpose) => {
    // Keep an incompatible Sold/Rented state so the owner must choose a valid one explicitly.
    update('listingPurpose', nextPurpose)
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="property-title" className={labelClassName}>Title</label>
        <input
          id="property-title"
          name="title"
          type="text"
          required
          value={value.title}
          onChange={(event) => update('title', event.currentTarget.value)}
          disabled={disabled}
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="property-description" className={labelClassName}>Description</label>
        <textarea
          id="property-description"
          name="description"
          required
          value={value.description}
          onChange={(event) => update('description', event.currentTarget.value)}
          disabled={disabled}
          rows={4}
          className={inputClassName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="property-purpose" className={labelClassName}>Listing purpose</label>
          <select
            id="property-purpose"
            name="listingPurpose"
            value={value.listingPurpose}
            onChange={(event) => changePurpose(event.currentTarget.value as PropertyPurpose)}
            disabled={disabled}
            className={inputClassName}
          >
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>
        <div>
          <label htmlFor="property-availability" className={labelClassName}>Availability</label>
          <select
            id="property-availability"
            name="availability"
            value={value.availability}
            aria-describedby={incompatibilityMessage ? 'property-availability-error' : undefined}
            onChange={(event) => update('availability', event.currentTarget.value as PropertyFormValues['availability'])}
            disabled={disabled}
            className={inputClassName}
          >
            {!compatible && (
              <option value={value.availability} disabled>
                {titleCase(value.availability)} — choose compatible availability
              </option>
            )}
            {availableOptions.map((option) => <option key={option} value={option}>{titleCase(option)}</option>)}
          </select>
          {incompatibilityMessage && (
            <p id="property-availability-error" role="alert" className="mt-1 text-sm text-destructive">
              {incompatibilityMessage}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="property-type" className={labelClassName}>Property type</label>
          <select
            id="property-type"
            name="type"
            value={value.type}
            onChange={(event) => update('type', event.currentTarget.value)}
            disabled={disabled}
            className={inputClassName}
          >
            {!allowedTypes.some((type) => type === value.type) && (
              <option value={value.type} disabled>
                {value.type} — choose a type available for {value.listingPurpose}
              </option>
            )}
            {allowedTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="property-location" className={labelClassName}>Location</label>
          <input
            id="property-location"
            name="location"
            type="text"
            required
            value={value.location}
            onChange={(event) => update('location', event.currentTarget.value)}
            disabled={disabled}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="property-price" className={labelClassName}>{priceLabel}</label>
          <input
            id="property-price"
            name="price"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="any"
            required
            value={value.price}
            onChange={(event) => update('price', event.currentTarget.value)}
            disabled={disabled}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="property-offer" className={labelClassName}>Offer (%)</label>
          <input
            id="property-offer"
            name="offerPercent"
            type="number"
            inputMode="decimal"
            min="0"
            max="99.99"
            step="0.01"
            value={value.offerPercent}
            onChange={(event) => update('offerPercent', event.currentTarget.value)}
            disabled={disabled}
            className={inputClassName}
          />
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Effective price preview: </span>
        {effectivePrice === null ? 'Enter a valid price and offer to preview.' : `KES ${formatPrice(effectivePrice)}`}
        {value.listingPurpose === 'rent' && effectivePrice !== null ? ' / month' : ''}
      </p>

      {value.type !== 'Land' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="property-bedrooms" className={labelClassName}>Bedrooms</label>
            <input
              id="property-bedrooms"
              name="bedrooms"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={value.bedrooms}
              onChange={(event) => update('bedrooms', event.currentTarget.value)}
              disabled={disabled}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="property-bathrooms" className={labelClassName}>Bathrooms</label>
            <input
              id="property-bathrooms"
              name="bathrooms"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={value.bathrooms}
              onChange={(event) => update('bathrooms', event.currentTarget.value)}
              disabled={disabled}
              className={inputClassName}
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="property-area" className={labelClassName}>Area</label>
        <input
          id="property-area"
          name="area"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={value.area}
          onChange={(event) => update('area', event.currentTarget.value)}
          disabled={disabled}
          className={inputClassName}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-foreground">Features</legend>
        <FeatureSelect
          value={value.features}
          onChange={(features) => update('features', features)}
          onBusyChange={onFeatureBusyChange}
          disabled={disabled}
        />
      </fieldset>

      <label htmlFor="property-featured" className="flex items-center gap-2 text-sm font-medium text-foreground">
        <input
          id="property-featured"
          name="featured"
          type="checkbox"
          checked={value.featured}
          onChange={(event) => update('featured', event.currentTarget.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-input accent-primary disabled:opacity-50"
        />
        Featured listing
      </label>
    </div>
  )
}

export default PropertyFields
