import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './pages/Index'
import Listings from './pages/Listings'
import Blog from './pages/Blog'
import PropertyDetails from './pages/PropertyDetails'
import BlogPost from './pages/BlogPost'
import About from './pages/About'
import Contact from './pages/Contact'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import { AuthProvider } from '@/hooks/useAuth'
import Login from './pages/Login'
import AdminRoute from '@/components/auth/AdminRoute'
import AdminProperties from './pages/AdminProperties'
import TestMDXEditor from './TestMDXEditor'
import AdminBlog from './pages/AdminBlog'
import AdminSettings from './pages/AdminSettings'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminViewingRequests from './pages/AdminViewingRequests'
import UserDashboard from './pages/UserDashboard'
import CurrencyConverter from './pages/CurrencyConverter'

const queryClient = new QueryClient()

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/:id" element={<PropertyDetails />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/currency-converter" element={<CurrencyConverter />} />
            <Route path="/test-mdx" element={<TestMDXEditor />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/properties"
              element={
                <AdminRoute>
                  <AdminProperties />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/blog"
              element={
                <AdminRoute>
                  <AdminBlog />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <AdminSettings />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/viewing-requests"
              element={
                <AdminRoute>
                  <AdminViewingRequests />
                </AdminRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
)

export default App
