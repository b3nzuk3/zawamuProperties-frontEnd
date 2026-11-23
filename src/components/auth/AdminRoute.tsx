import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuthContext'

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.isAdmin !== true) return <Navigate to="/dashboard" replace />
  return children
}
