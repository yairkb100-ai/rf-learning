import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import api from '../api/axios'

// ============================================================================
// דף התחברות (LoginPage)
// ----------------------------------------------------------------------------
// תפקיד:
//   טופס כניסה למערכת. המשתמש מזין שם משתמש וסיסמה, ובהצלחה מנותב לדף הבית.
//   כולל כפתור החלפת עיצוב. זהו הדף היחיד שאינו דורש התחברות מוקדמת.
//
// מבנה עיקרי / state:
//   • username / password — שדות הטופס.
//   • error / loading     — הודעת שגיאה ומצב שליחה.
//
// הקשר במערכת:
//   route: "/login". פונה ל-POST /auth/login. בהצלחה קורא ל-login מקונטקסט
//   ההזדהות (שומר טוקנים) ומנווט ל-"/".
// ============================================================================

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // שליחת הטופס: שולח שם משתמש (מנורמל לאותיות גדולות) וסיסמה ל-POST /auth/login.
  // בהצלחה שומר את ההזדהות ומנווט לדף הבית; אחרת מציג הודעת שגיאה.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { username: username.trim().toUpperCase(), password })
      login(res.data.accessToken, res.data.refreshToken, res.data.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בהתחברות')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="auth-card">
        <h1>ברוכים הבאים ללומדת ענף 71</h1>
        <h2>התחברות למערכת</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>שם משתמש</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="OA123456789"
              dir="ltr"
              maxLength={11}
            />
          </div>
          <div className="form-group">
            <label>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              dir="ltr"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
      </div>
    </div>
  )
}
