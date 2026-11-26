import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ImageFilePreview from './ImageFilePreview'
import { isHeicImage } from '@/lib/image-upload'

afterEach(() => vi.restoreAllMocks())

describe('selected image previews', () => {
  it.each([
    { name: 'phone.HEIC', type: '' },
    { name: 'phone.heif', type: 'application/octet-stream' },
    { name: 'photo', type: 'image/heic' },
    { name: 'photo', type: 'image/heif' },
  ])('recognizes HEIC with browser MIME or extension: $name / $type', ({ name, type }) => {
    expect(isHeicImage({ name, type })).toBe(true)
    const read = vi.spyOn(FileReader.prototype, 'readAsDataURL')
    render(<ImageFilePreview file={new File(['fixture'], name, { type })} className="w-24 h-24" />)
    expect(screen.getByRole('img', { name: `Selected file: ${name}` })).toBeInTheDocument()
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument()
    expect(read).not.toHaveBeenCalled()
  })

  it('keeps ordinary image previews and falls back on browser decode failure', async () => {
    expect(isHeicImage({ name: 'photo.jpg', type: 'image/jpeg' })).toBe(false)
    const file = new File(['fixture'], 'photo.jpg', { type: 'image/jpeg' })
    render(<ImageFilePreview file={file} className="w-24 h-24" />)
    const preview = await screen.findByAltText('Preview')
    expect(preview).toHaveAttribute('src', expect.stringMatching(/^data:image\/jpeg/))
    fireEvent.error(preview)
    expect(screen.getByRole('img', { name: 'Selected file: photo.jpg' })).toBeInTheDocument()
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument()
  })

  it('clears a prior image when switching the same preview slot to HEIF', async () => {
    const { rerender } = render(<ImageFilePreview file={new File(['fixture'], 'photo.jpg', { type: 'image/jpeg' })} className="w-24 h-24" />)
    await screen.findByAltText('Preview')
    rerender(<ImageFilePreview file={new File(['fixture'], 'next.heif', { type: '' })} className="w-24 h-24" />)
    expect(screen.getByRole('img', { name: 'Selected file: next.heif' })).toBeInTheDocument()
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument()
  })
})
