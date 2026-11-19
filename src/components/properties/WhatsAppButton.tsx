import type { Property } from '@/types/property'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildPropertyWhatsAppUrl } from '@/lib/whatsapp'

interface WhatsAppButtonProps {
  property: Property
  className?: string
}

export function WhatsAppButton({ property, className }: WhatsAppButtonProps) {
  const href = buildPropertyWhatsAppUrl(property, window.location.origin)
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Contact about ${property.title} on WhatsApp`}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      <MessageCircle aria-hidden="true" className="h-4 w-4" />
      WhatsApp
    </a>
  )
}
