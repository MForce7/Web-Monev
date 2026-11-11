import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute() {
  const { session, sessionLoading } = useAuth()
  const location = useLocation()

  if (sessionLoading) return <p className="p-6 text-sm">Memuat...</p>
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}