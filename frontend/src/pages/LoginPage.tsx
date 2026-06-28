import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import api from '../api/axios'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [nationalId, setNationalId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { national_id: nationalId, password })
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
            <label>תעודת זהות</label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
              placeholder="123456789"
              dir="ltr"
              maxLength={9}
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
