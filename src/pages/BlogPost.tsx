import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react'
import api from '@/lib/api'

type Blog = {
  _id?: string
  id?: string
  title: string
  content: string
  author?: string
  category?: string
  readTime?: string
  image?: string
  date?: string
}

export default function BlogPost() {
  const { id } = useParams()
  const [post, setPost] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get(`/blog/${id}`)
        setPost(res.data)
      } catch (err) {
        setError('Failed to load article.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchPost()
  }, [id])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading)
    return (
      <Layout>
        <div className="py-24 text-center text-lg">Loading article...</div>
      </Layout>
    )

  if (error)
    return (
      <Layout>
        <div className="py-24 text-center text-red-500">{error}</div>
      </Layout>
    )

  if (!post)
    return (
      <Layout>
        <div className="py-24 text-center text-lg">Article not found.</div>
      </Layout>
    )

  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <Link to="/blog">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
              </Button>
            </Link>
          </div>

          <div className="mb-6">
            <div className="text-accent text-sm font-medium mb-2">
              {post.category}
            </div>
            <h1 className="font-heading font-bold text-3xl text-foreground mb-3">
              {post.title}
            </h1>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {post.author}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(post.date)}
                </span>
              </div>
              {post.readTime && (
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {post.readTime}
                </span>
              )}
            </div>
          </div>

          {post.image && (
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-80 object-cover rounded-xl mb-6"
            />
          )}

          <Card>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none p-6">
              {post.content?.split('\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
