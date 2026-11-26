export type ImageSize = 'thumbnail' | 'card' | 'large'

const IMAGE_SIZES = new Set<ImageSize>(['thumbnail', 'card', 'large'])
const UUID_V4 = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'

interface ParsedPublicUrl {
  url: URL
  rawPath: string
}

function parseStrictHttpsUrl(value: string): ParsedPublicUrl | null {
  if (/\s/.test(value)) return null
  // Keep the raw path available: URL normalizes dot segments, which must not
  // turn a traversal-shaped input into a URL we consider owned.
  const match = /^https:\/\/([^/?#\\]+)(\/[^?#\\]*)?$/.exec(value)
  if (!match) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || match[1].includes('@')) return null
    return { url, rawPath: match[2] ?? '' }
  } catch {
    return null
  }
}

function getNormalizedBasePath(rawPath: string): string | null {
  const normalized = rawPath.replace(/\/+$/, '')
  if (normalized.includes('%') || normalized.includes('\\')) return null
  if (normalized === '') return ''

  const segments = normalized.slice(1).split('/')
  if (segments.some((segment) => (
    segment === '' || segment === '.' || segment === '..' || !/^[A-Za-z0-9._~-]+$/.test(segment)
  ))) return null

  return normalized
}

/**
 * Replace only canonical large.webp URLs beneath the configured public media
 * base. All legacy, foreign, malformed, and unconfigured URLs pass through.
 */
export function resolveImageUrl(src: string, size: ImageSize, publicBaseUrl?: string): string {
  if (!IMAGE_SIZES.has(size) || !publicBaseUrl) return src

  const base = parseStrictHttpsUrl(publicBaseUrl)
  const source = parseStrictHttpsUrl(src)
  if (!base || !source || source.url.origin !== base.url.origin) return src

  const basePath = getNormalizedBasePath(base.rawPath)
  if (basePath === null) return src

  if (!source.rawPath.startsWith(`${basePath}/`)) return src
  const imagePath = source.rawPath.slice(basePath.length)
  if (!new RegExp(`^/images/v1/${UUID_V4}/large\\.webp$`).test(imagePath)) return src

  return `${src.slice(0, src.lastIndexOf('/') + 1)}${size}.webp`
}

export function getImageUrl(src: string, size: ImageSize): string {
  return resolveImageUrl(src, size, import.meta.env.VITE_MEDIA_PUBLIC_URL)
}
