import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, User, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import api from '@/lib/api'

export default function LatestBlog() {
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBlogs() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/blog')
        // Sort by publishedAt descending and take the latest 3
        const sorted = res.data
          .sort(
            (a: any, b: any) =>
              new Date(b.publishedAt).getTime() -
              new Date(a.publishedAt).getTime()
          )
          .slice(0, 3)
        setBlogPosts(sorted)
      } catch (err: any) {
        setError('Failed to load blog posts.')
      } finally {
        setLoading(false)
      }
    }
    fetchBlogs()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <section className="py-16 lg:py-24 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Latest Insights
          </div>
          <h2 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Real Estate Blog
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay informed with expert insights, market trends, and valuable tips
            from our real estate professionals
          </p>
        </div>

        {/* Loading/Error State */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blogPosts.map((post, index) => (
              <Card
                key={post._id || post.id}
                className={`property-card group overflow-hidden ${
                  index === 0 ? 'animate-fade-in-up' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={
                      post.image ||
                      'https://via.placeholder.com/800x400?text=No+Image'
                    }
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-heading font-semibold text-xl text-foreground mb-3 group-hover:text-accent transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {post.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-6">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                  </div>
                  <Link to={`/blog/${post.slug || post._id}`}>
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                    >
                      Read More
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Link to="/blog">
            <Button size="lg">
              View All Articles
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
