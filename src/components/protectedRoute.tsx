import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../lib/useSession'

export default function ProtectedRoute() {
  const { session, loading } = useSession()
  const location = useLocation()

  if (loading) return <p className="p-6 text-sm">Memuat...</p>
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}