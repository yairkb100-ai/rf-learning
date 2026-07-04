import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface User {
  id: number
  role: string
  full_name: string
  national_id: string
  is_super_admin?: boolean
}

interface AuthContextType {
  user: User | null
  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => void
  isLoading: boolean
}

// ============================================================================
// קונטקסט ההזדהות (Auth Context)
// ----------------------------------------------------------------------------
// תפקיד:
//   מנהל את מצב המשתמש המחובר עבור כל האפליקציה. מספק את פרטי המשתמש
//   ואת הפעולות login / logout לכל רכיב שצריך אותם (דרך ה-hook useAuth).
//
// מה ה-context מספק:
//   • user      — אובייקט המשתמש המחובר (או null אם לא מחובר).
//   • login     — שומר טוקנים ופרטי משתמש ב-localStorage ומעדכן את המצב.
//   • logout    — מנקה את הזיכרון ומאפס את המשתמש.
//   • isLoading — true בזמן טעינת המשתמש הראשונית מ-localStorage.
//
// הקשר במערכת:
//   נטען ב-App.tsx (עוטף את כל הדפים). PrivateRoute משתמש בו כדי לחסום
//   גישה לדפים ללא התחברות. Navbar משתמש בו להצגת שם המשתמש וכפתור יציאה.
// ============================================================================

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // בטעינה הראשונית: משחזר את המשתמש מ-localStorage אם קיים טוקן תקף,
  // כדי שהמשתמש יישאר מחובר גם לאחר רענון הדף.
  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [])

  // התחברות: שומר את הטוקנים ואת פרטי המשתמש ב-localStorage ומעדכן את מצב ה-user.
  // נקרא ע"י דף ההתחברות/הרשמה לאחר קבלת תשובה חיובית מהשרת.
  function login(accessToken: string, refreshToken: string, userData: User) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  // התנתקות: מנקה את כל הזיכרון המקומי ומאפס את המשתמש (מוביל בפועל לחזרה למסך התחברות).
  function logout() {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook נוח לצריכת קונטקסט ההזדהות. זורק שגיאה אם נעשה בו שימוש מחוץ ל-AuthProvider.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
