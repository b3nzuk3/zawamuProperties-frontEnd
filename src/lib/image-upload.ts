export const OWNER_IMAGE_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.heic',
  '.heif',
].join(',')

export const IMAGE_UPLOAD_HELPER_TEXT =
  'JPEG, PNG, WebP, AVIF, HEIC, and HEIF are supported. Max 8 MiB and 24 MP per image; the server automatically converts uploads to WebP.'

export function isHeicImage(file: Pick<File, 'name' | 'type'>) {
  const mimeType = file.type.toLowerCase().split(';', 1)[0]
  return (
    mimeType === 'image/heic' ||
    mimeType === 'image/heif' ||
    mimeType === 'image/heic-sequence' ||
    mimeType === 'image/heif-sequence' ||
    /\.(heic|heif)$/i.test(file.name)
  )
}
