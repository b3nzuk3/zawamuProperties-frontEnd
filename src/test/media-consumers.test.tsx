// API responses are fixtures; these tests do not contact a server or media provider.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import api from '@/lib/api'
import Blog from '@/pages/Blog'
import BlogPost from '@/pages/BlogPost'
import LatestBlog from '@/components/home/LatestBlog'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const base = 'https://media.zawamu.test/assets'
const firstUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const secondUuid = 'a47ac10b-58cc-4372-a567-0e02b2c3d470'
const mediaUrl = (uuid: string) => `${base}/images/v1/${uuid}/large.webp`

afterEach(() => vi.unstubAllEnvs())
beforeEach(() => vi.clearAllMocks())

describe('blog image variants', () => {
  it('uses card WebPs for featured and regular blog cards', async () => {
    vi.stubEnv('VITE_MEDIA_PUBLIC_URL', `${base}/`)
    vi.mocked(api.get).mockResolvedValue({ data: [
      {
        _id: 'featured-post',
        title: 'Featured Article',
        content: 'Featured body',
        image: mediaUrl(firstUuid),
        author: 'Editor',
        category: 'Homes',
        date: '2026-11-25T00:00:00.000Z',
        readTime: '5 min',
      },
      {
        _id: 'regular-post',
        title: 'Regular Article',
        content: 'Regular body',
        image: mediaUrl(secondUuid),
        author: 'Editor',
        category: 'Market',
        date: '2026-11-24T00:00:00.000Z',
        readTime: '4 min',
      },
    ] } as never)
    render(<MemoryRouter><Blog /></MemoryRouter>)

    expect(await screen.findByRole('img', { name: 'Featured Article' })).toHaveAttribute(
      'src',
      `${base}/images/v1/${firstUuid}/card.webp`,
    )
    expect(screen.getByRole('img', { name: 'Regular Article' })).toHaveAttribute(
      'src',
      `${base}/images/v1/${secondUuid}/card.webp`,
    )
  })

  it('uses a card WebP in latest-blog cards', async () => {
    vi.stubEnv('VITE_MEDIA_PUBLIC_URL', base)
    vi.mocked(api.get).mockResolvedValue({ data: [{
      _id: 'latest-post',
      title: 'Latest Article',
      content: 'Latest body',
      image: mediaUrl(firstUuid),
      author: 'Editor',
      publishedAt: '2026-11-25T00:00:00.000Z',
      readTime: '5 min',
    }] } as never)
    render(<MemoryRouter><LatestBlog /></MemoryRouter>)

    expect(await screen.findByRole('img', { name: 'Latest Article' })).toHaveAttribute(
      'src',
      `${base}/images/v1/${firstUuid}/card.webp`,
    )
  })

  it('keeps the large WebP for full blog article imagery', async () => {
    vi.stubEnv('VITE_MEDIA_PUBLIC_URL', base)
    vi.mocked(api.get).mockResolvedValue({ data: {
      _id: 'article-1',
      title: 'Full Article',
      content: 'Long-form article text.',
      image: mediaUrl(firstUuid),
    } } as never)
    render(
      <MemoryRouter initialEntries={['/blog/article-1']}>
        <Routes><Route path="/blog/:id" element={<BlogPost />} /></Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('img', { name: 'Full Article' })).toHaveAttribute('src', mediaUrl(firstUuid))
  })
})
