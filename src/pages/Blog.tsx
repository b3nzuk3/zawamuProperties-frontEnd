import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import {
  Search,
  Calendar,
  User,
  Clock,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import api from '@/lib/api'

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/blog')
        setPosts(res.data)
      } catch (err) {
        setError('Failed to load blog posts.')
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const featuredPost = filteredPosts[0]
  const regularPosts = filteredPosts.slice(1)

  if (loading)
    return (
      <Layout>
        <div className="py-24 text-center text-lg">Loading blog posts...</div>
      </Layout>
    )
  if (error)
    return (
      <Layout>
        <div className="py-24 text-center text-red-500">{error}</div>
      </Layout>
    )

  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <BookOpen className="h-4 w-4 mr-2" />
              Real Estate Insights
            </div>
            <h1 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-4">
              Latest from Our Blog
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expert insights, market trends, and valuable tips from our real
              estate professionals
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Featured Post */}
          {!searchTerm && featuredPost && (
            <Card className="mb-12 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-64 lg:h-auto">
                  <img
                    src={featuredPost.image || '/placeholder.jpg'}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Featured
                    </span>
                  </div>
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <div className="mb-4">
                    <span className="text-accent text-sm font-medium">
                      {featuredPost.category}
                    </span>
                  </div>
                  <h2 className="font-heading font-bold text-2xl lg:text-3xl text-foreground mb-4">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {featuredPost.content?.slice(0, 150) +
                      (featuredPost.content?.length > 150 ? '...' : '')}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{featuredPost.author}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(featuredPost.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>
                  <Link to={`/blog/${featuredPost._id || featuredPost.id}`}>
                    <Button size="lg">
                      Read Full Article
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </div>
            </Card>
          )}

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post, index) => (
              <Card
                key={post._id || post.id}
                className={`property-card group overflow-hidden ${
                  index === 0 ? 'animate-fade-in-up' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={post.image || '/placeholder.jpg'}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-foreground">
                      {post.category}
                    </span>
                  </div>
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
                      {post.content?.slice(0, 120) +
                        (post.content?.length > 120 ? '...' : '')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-6">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(post.date)}</span>
                    </div>
                  </div>

                  <Link to={`/blog/${post._id || post.id}`}>
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

          {/* No Results */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                No articles found matching your search.
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search terms.
              </p>
            </div>
          )}

          {/* Newsletter CTA */}
          <div className="mt-16 bg-gradient-primary rounded-2xl p-8 text-center">
            <h3 className="font-heading font-bold text-2xl text-primary-foreground mb-4">
              Stay Updated with Market Insights
            </h3>
            <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
              Get the latest real estate trends, tips, and market analysis
              delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                placeholder="Enter your email"
                className="bg-background/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/70"
              />
              <Button variant="secondary" className="sm:px-8">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
