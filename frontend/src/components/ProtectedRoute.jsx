import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../auth/useAuth'

export default function ProtectedRoute() {
  const { token } = useAuthStore()

  if (!token) {
    // If there is no local JWT token, they have strictly not finished the Entra callback natively.
    return <Navigate to="/login" replace />
  }

  // They are authenticated locally with Django and have a live token.
  return <Outlet />
}
