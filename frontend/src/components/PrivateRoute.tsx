import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div className="loading">טוען...</div>
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
