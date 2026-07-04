import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

// ============================================================================
// דף הרשמה (RegisterPage)
// ----------------------------------------------------------------------------
// תפקיד:
//   טופס יצירת חשבון חדש (שם, אימייל, תעודת זהות, סיסמה). בהצלחה מחבר את
//   המשתמש אוטומטית ומנווט לדף הבית. כולל קישור חזרה לדף ההתחברות.
//   הערה: דף זה אינו מנותב כברירת מחדל ב-App.tsx (נותב ישירות רק /login).
//
// מבנה עיקרי / state:
//   • form            — כל שדות ההרשמה באובייקט אחד.
//   • error / loading — הודעת שגיאה ומצב שליחה.
//
// הקשר במערכת:
//   פונה ל-POST /auth/register. בהצלחה קורא ל-login (שומר טוקנים) ומנווט ל-"/".
// ============================================================================

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    national_id: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // עדכון גנרי של שדה בטופס לפי שם ה-input (name).
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // שליחת הטופס ל-POST /auth/register. בהצלחה מחבר את המשתמש ומנווט לדף הבית.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.accessToken, res.data.refreshToken, res.data.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בהרשמה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>מערכת לימוד RF</h1>
        <h2>הרשמה</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>שם פרטי</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} required placeholder="ישראל" />
            </div>
            <div className="form-group">
              <label>שם משפחה</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} required placeholder="ישראלי" />
            </div>
          </div>
          <div className="form-group">
            <label>אימייל</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" dir="ltr" />
          </div>
          <div className="form-group">
            <label>תעודת זהות</label>
            <input name="national_id" value={form.national_id} onChange={handleChange} required placeholder="123456789" dir="ltr" maxLength={9} />
          </div>
          <div className="form-group">
            <label>סיסמה</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="לפחות 6 תווים" dir="ltr" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'נרשם...' : 'הירשם'}
          </button>
        </form>
        <p className="auth-link">
          יש לך חשבון? <Link to="/login">התחבר כאן</Link>
        </p>
      </div>
    </div>
  )
}
