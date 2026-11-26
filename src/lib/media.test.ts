import { afterEach, describe, expect, it, vi } from 'vitest'
import { getImageUrl, resolveImageUrl } from './media'

const base = 'https://media.zawamu.test/assets/'
const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const largeUrl = `https://media.zawamu.test/assets/images/v1/${uuid}/large.webp`

afterEach(() => vi.unstubAllEnvs())

describe('R2 image URL resolution', () => {
  it.each(['thumbnail', 'card', 'large'] as const)('selects the %s object for an owned canonical URL', (size) => {
    expect(resolveImageUrl(largeUrl, size, base)).toBe(
      `https://media.zawamu.test/assets/images/v1/${uuid}/${size}.webp`,
    )
  })

  it('normalizes trailing slashes on the configured public base', () => {
    expect(resolveImageUrl(largeUrl, 'card', 'https://media.zawamu.test/assets////')).toBe(
      `https://media.zawamu.test/assets/images/v1/${uuid}/card.webp`,
    )
  })

  it.each([
    'https://other.zawamu.test/assets/images/v1/f47ac10b-58cc-4372-a567-0e02b2c3d479/large.webp',
    'https://media.zawamu.test.evil.test/assets/images/v1/f47ac10b-58cc-4372-a567-0e02b2c3d479/large.webp',
    'https://media.zawamu.test/assets-evil/images/v1/f47ac10b-58cc-4372-a567-0e02b2c3d479/large.webp',
    `https://media.zawamu.test/assets/images/v1/${uuid}/large.webp?download=1`,
    `https://media.zawamu.test/assets/images/v1/${uuid}/large.webp#preview`,
    `https://media.zawamu.test/assets/images/v1/${uuid}/card.webp`,
    `https://media.zawamu.test/assets/images/v1/${uuid}/../${uuid}/large.webp`,
    `https://media.zawamu.test/assets/images/v1/%2e%2e/${uuid}/large.webp`,
    'https://media.zawamu.test/assets/images/v1/f47ac10b-58cc-1372-a567-0e02b2c3d479/large.webp',
    'https://media.zawamu.test/assets/images/v1/F47AC10B-58CC-4372-A567-0E02B2C3D479/large.webp',
    'https://media.zawamu.test/assets/images/v1/not-a-uuid/large.webp',
    'https://@media.zawamu.test/assets/images/v1/f47ac10b-58cc-4372-a567-0e02b2c3d479/large.webp',
    'http://media.zawamu.test/assets/images/v1/f47ac10b-58cc-4372-a567-0e02b2c3d479/large.webp',
    'https://res.cloudinary.com/account/image/upload/sample.jpg',
    'blob:https://media.zawamu.test/3c4d',
    'data:image/png;base64,AAAA',
    '/legacy/local-image.jpg',
  ])('leaves non-owned, unsafe, or legacy URL unchanged: %s', (src) => {
    expect(resolveImageUrl(src, 'thumbnail', base)).toBe(src)
  })

  it.each([
    undefined,
    '',
    'not a URL',
    'http://media.zawamu.test/assets',
    'https://user:pass@media.zawamu.test/assets',
    'https://media.zawamu.test/assets?version=1',
    'https://media.zawamu.test/assets#media',
    'https://@media.zawamu.test/assets',
    'https://media.zawamu.test/./assets',
    'https://media.zawamu.test/../assets',
    'https://media.zawamu.test/%61ssets',
    'https://media.zawamu.test\t/assets',
  ])('fails safe when the public base is absent or invalid: %s', (publicBase) => {
    expect(resolveImageUrl(largeUrl, 'card', publicBase)).toBe(largeUrl)
  })

  it('supports an origin-root base and does not rewrite a sibling path', () => {
    const source = `https://media.zawamu.test/images/v1/${uuid}/large.webp`
    expect(resolveImageUrl(source, 'card', 'https://media.zawamu.test/')).toBe(source.replace('/large.webp', '/card.webp'))
    expect(resolveImageUrl(largeUrl, 'card', 'https://media.zawamu.test/asset')).toBe(largeUrl)
  })

  it('never normalizes whitespace in a source authority into an owned URL', () => {
    const malformed = largeUrl.replace('media.zawamu.test', 'media.zawamu.test\t')
    expect(resolveImageUrl(malformed, 'card', base)).toBe(malformed)
  })

  it('reads the public media base from Vite configuration', () => {
    vi.stubEnv('VITE_MEDIA_PUBLIC_URL', base)
    expect(getImageUrl(largeUrl, 'thumbnail')).toBe(
      `https://media.zawamu.test/assets/images/v1/${uuid}/thumbnail.webp`,
    )
  })
})
