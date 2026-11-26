import { useEffect, useState } from 'react'
import { isHeicImage } from '@/lib/image-upload'

type ImageFilePreviewProps = {
  file: File
  alt?: string
  className: string
}

export default function ImageFilePreview({
  file,
  alt = 'Preview',
  className,
}: ImageFilePreviewProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)
  const heicImage = isHeicImage(file)

  useEffect(() => {
    setSrc(null)
    setPreviewFailed(false)
    if (isHeicImage(file)) return

    const reader = new FileReader()
    reader.onload = () => {
      setSrc(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.onerror = () => setPreviewFailed(true)
    reader.readAsDataURL(file)
    return () => reader.abort()
  }, [file])

  if (heicImage || !src || previewFailed) {
    return (
      <div
        role="img"
        aria-label={`Selected file: ${file.name}`}
        className={`${className} flex flex-col items-center justify-center gap-1 overflow-hidden bg-muted/50 p-2 text-center text-[10px] text-muted-foreground`}
      >
        <span>{heicImage ? 'HEIC/HEIF preview unavailable' : 'Image preview unavailable'}</span>
        <span className="max-w-full truncate" title={file.name}>{file.name}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setPreviewFailed(true)}
    />
  )
}
