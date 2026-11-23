// Local property fixtures only; no API calls or WhatsApp messages are sent.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Property } from '@/types/property'
import { PropertyCardActions } from './PropertyCardActions'

const property: Property = {
  _id: 'card-123', title: 'Garden apartment', description: 'A bright home',
  price: 100_000, location: 'Kilimani', type: 'Apartment', availability: 'available',
}

function Location() {
  return <output aria-label="Current location">{useLocation().pathname}</output>
}

function renderActions(overrides: Partial<Property> = {}) {
  return render(
    <MemoryRouter initialEntries={['/listings']}>
      <article className="relative">
        <PropertyCardActions property={{ ...property, ...overrides }} />
      </article>
      <Location />
    </MemoryRouter>,
  )
}

describe('PropertyCardActions', () => {
  it('keeps a semantic details link above equal-width, labeled icon-only contact controls', () => {
    renderActions()
    const details = screen.getByRole('link', { name: /view details/i })
    const whatsapp = screen.getByRole('link', { name: /whatsapp/i })
    const viewing = screen.getByRole('button', { name: 'Schedule Viewing' })
    expect(details).toHaveAttribute('href', '/listings/card-123')
    expect(details.querySelector('button')).toBeNull()
    expect(details.className).toContain('after:inset-0')
    expect(whatsapp.parentElement).toBe(viewing.parentElement)
    expect(whatsapp.parentElement).toHaveClass('grid-cols-2', 'relative', 'z-20')
    expect(details.compareDocumentPosition(whatsapp) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(whatsapp).toHaveTextContent('')
    expect(viewing).toHaveTextContent('')
    expect(whatsapp).toHaveAttribute('title', 'WhatsApp')
    expect(viewing).toHaveAttribute('title', 'Schedule Viewing')
    expect(details.closest('article')?.querySelector('a a, a button, button a')).toBeNull()
  })

  it('opens the real viewing dialog without navigating and restores trigger focus on close', async () => {
    const user = userEvent.setup()
    renderActions()
    const trigger = screen.getByRole('button', { name: 'Schedule Viewing' })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByText('Garden apartment', { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText('Current location')).toHaveTextContent('/listings')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it.each(['sold', 'rented', null, 'unknown'])('disables only viewing for %s listings', (availability) => {
    renderActions({ availability } as Partial<Property>)
    expect(screen.getByRole('button', { name: 'Viewing unavailable' })).toBeDisabled()
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute('href', '/listings/card-123')
    expect(screen.queryByRole('button', { name: 'Schedule Viewing' })).not.toBeInTheDocument()
  })

  it('supports keyboard navigation through the details link', async () => {
    const user = userEvent.setup()
    renderActions()
    await user.tab()
    expect(screen.getByRole('link', { name: /view details/i })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByLabelText('Current location')).toHaveTextContent('/listings/card-123')
  })
})
