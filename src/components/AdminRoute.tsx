import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function AdminRoute() {
  const { session, sessionLoading, role, roleLoading } = useAuth()
  const location = useLocation()

  if (sessionLoading || roleLoading) {
    return <p className="p-6 text-sm">Memuat...</p>
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}