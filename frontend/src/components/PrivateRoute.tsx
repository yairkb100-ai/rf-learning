import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ============================================================================
// מסלול מוגן (PrivateRoute)
// ----------------------------------------------------------------------------
// תפקיד:
//   רכיב עוטף המגן על דפים הדורשים התחברות. אם המשתמש אינו מחובר —
//   מפנה אותו למסך ההתחברות. אחרת מציג את התוכן העטוף.
//
// הקשר במערכת:
//   משמש ב-App.tsx כדי לעטוף את כל הדפים שאינם /login.
// ============================================================================

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  // בזמן טעינת ההזדהות הראשונית — מציג הודעת טעינה במקום להבהב למסך התחברות.
  if (isLoading) return <div className="loading">טוען...</div>
  // אין משתמש מחובר — הפניה למסך ההתחברות (replace כדי לא להשאיר בהיסטוריה).
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
