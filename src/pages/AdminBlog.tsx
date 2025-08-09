import React, { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import api from '@/lib/api'
import MdEditor from 'react-markdown-editor-lite'
import MarkdownIt from 'markdown-it'
import 'react-markdown-editor-lite/lib/index.css'

interface BlogPost {
  _id: string
  title: string
  content: string
  author?: string
  category?: string
  readTime?: string
  image?: string
  date?: string
  tags?: string[]
  featured?: boolean
}

const POSTS_PER_PAGE = 5

const AdminBlog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editPost, setEditPost] = useState<BlogPost | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const mdParser = new MarkdownIt()

  // Fetch all blog posts
  const fetchPosts = async () => {
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

  useEffect(() => {
    fetchPosts()
  }, [])

  // Search filter
  const filteredPosts = posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  )

  // Reset to first page on search
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Edit post handlers
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editPost) return
    setEditPost({ ...editPost, [e.target.name]: e.target.value })
  }

  const handleEditSave = async () => {
    if (!editPost) return
    setEditLoading(true)
    try {
      await api.put(`/blog/${editPost._id}`, editPost)
      setEditPost(null)
      fetchPosts()
    } catch (err) {
      // Optionally show error
    } finally {
      setEditLoading(false)
    }
  }

  // Delete post handlers
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await api.delete(`/blog/${deleteId}`)
      setDeleteId(null)
      fetchPosts()
    } catch (err) {
      // Optionally show error
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-4">
            Manage Blog Posts
          </h1>
          <p className="text-muted-foreground mb-8">
            Here you can create, edit, and delete blog posts.
          </p>

          {/* Search */}
          <div className="mb-6 max-w-md">
            <Input
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className=""
            />
          </div>

          {/* Blog List */}
          {loading ? (
            <div className="py-12 text-center">Loading...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No blog posts found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Title</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-left">Author</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPosts.map((post) => (
                      <tr key={post._id} className="border-b">
                        <td className="p-2 font-medium">{post.title}</td>
                        <td className="p-2">{post.category}</td>
                        <td className="p-2">{post.author}</td>
                        <td className="p-2">{post.date}</td>
                        <td className="p-2 flex gap-2">
                          {/* Edit Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditPost(post)}
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            {editPost && editPost._id === post._id && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Blog Post</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium mb-1">
                                      Title
                                    </label>
                                    <Input
                                      name="title"
                                      placeholder="Title"
                                      value={editPost.title}
                                      onChange={handleEditChange}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">
                                      Category
                                    </label>
                                    <Input
                                      name="category"
                                      placeholder="Category"
                                      value={editPost.category || ''}
                                      onChange={handleEditChange}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">
                                      Author
                                    </label>
                                    <Input
                                      name="author"
                                      placeholder="Author"
                                      value={editPost.author || ''}
                                      onChange={handleEditChange}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="edit-featured"
                                      name="featured"
                                      checked={!!editPost.featured}
                                      onChange={(e) =>
                                        setEditPost({
                                          ...editPost,
                                          featured: e.target.checked,
                                        })
                                      }
                                      className="h-4 w-4"
                                    />
                                    <label
                                      htmlFor="edit-featured"
                                      className="text-sm font-medium"
                                    >
                                      Mark as Featured
                                    </label>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">
                                      Content
                                    </label>
                                    <MdEditor
                                      value={editPost.content}
                                      style={{ height: '300px' }}
                                      renderHTML={(text) =>
                                        mdParser.render(text)
                                      }
                                      onChange={({ text }) =>
                                        setEditPost({
                                          ...editPost,
                                          content: text,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleEditSave}
                                    disabled={editLoading}
                                  >
                                    {editLoading ? 'Saving...' : 'Save'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            )}
                          </Dialog>
                          {/* Delete AlertDialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteId(post._id)}
                              >
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            {deleteId === post._id && (
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Blog Post
                                  </AlertDialogTitle>
                                </AlertDialogHeader>
                                <div>
                                  Are you sure you want to delete{' '}
                                  <span className="font-semibold">
                                    {post.title}
                                  </span>
                                  ?
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={() => setDeleteId(null)}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                    className="bg-destructive text-white"
                                  >
                                    {deleteLoading ? 'Deleting...' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            )}
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i + 1}
                      size="sm"
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default AdminBlog
