import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

// ============================================================================
// דף דשבורד ניהול (AdminDashboardPage)
// ----------------------------------------------------------------------------
// תפקיד:
//   מציג תמונת מצב כללית של המערכת למנהל: מספרי תלמידים/מנהלים/קורסים/מגמות,
//   ממוצעי השלמה וציונים, מספר מבחנים הממתינים לבדיקה, וטבלת הקורסים הקשים
//   ביותר (הציון הממוצע הנמוך).
//
// מבנה עיקרי:
//   • Stats — טיפוס נתוני הסטטיסטיקה שמתקבלים מהשרת.
//   • Kpi   — רכיב תצוגה של כרטיס מדד בודד (עם הדגשה כשיש התראה).
//
// הקשר במערכת:
//   route: "/admin/dashboard". פונה ל-GET /admin/dashboard.
// ============================================================================

interface Stats {
  total_students: number
  total_admins: number
  total_courses: number
  total_specializations: number
  avg_score: number | null
  avg_completion: number | null
  pending_reviews: number
  hardest_courses: { id: number; title: string; avg_score: number | null; attempts: number }[]
}

function Kpi({ label, value, alert }: { label: string; value: React.ReactNode; alert?: boolean }) {
  return (
    <div className="kpi-card" style={alert ? { borderColor: 'var(--danger, #e74c3c)' } : undefined}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [s, setS] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  // רק מנהל
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/')
    }
  }, [user, navigate])

  // בטעינה: טוען את נתוני הדשבורד מהשרת (GET /admin/dashboard).
  useEffect(() => {
    api.get('/admin/dashboard')
      .then((r) => setS(r.data))
      .catch(() => setError('שגיאה בטעינת הדשבורד'))
  }, [])

  return (
    <div className="page">
      <Navbar subtitle="דשבורד"
        back={<button className="btn-back" onClick={() => navigate('/admin')}>← חזרה לניהול</button>} />
      <main className="main-content">
        {error && <p className="error-msg">{error}</p>}
        {s && (
          <>
            <section className="admin-section">
              <h2>תמונת מצב כללית</h2>
              <div className="kpi-grid">
                <Kpi label="תלמידים" value={s.total_students} />
                <Kpi label="מנהלים" value={s.total_admins} />
                <Kpi label="קורסים" value={s.total_courses} />
                <Kpi label="מגמות" value={s.total_specializations} />
                <Kpi label="ממוצע פרקים שהושלמו לתלמיד" value={s.avg_completion ?? '—'} />
                <Kpi label="ציון מבחן ממוצע" value={s.avg_score != null ? `${s.avg_score}%` : '—'} />
                <Kpi label="מבחנים ממתינים לבדיקה" value={s.pending_reviews} alert={s.pending_reviews > 0} />
              </div>
            </section>

            <section className="admin-section">
              <h2>קורסים עם הציון הממוצע הנמוך ביותר</h2>
              {s.hardest_courses.length === 0 ? (
                <p className="empty-state">אין עדיין נתוני מבחנים</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>קורס</th><th>ציון ממוצע</th><th>ניסיונות</th></tr></thead>
                  <tbody>
                    {s.hardest_courses.map((c) => (
                      <tr key={c.id}>
                        <td>{c.title}</td>
                        <td>{c.avg_score != null ? `${c.avg_score}%` : '—'}</td>
                        <td>{c.attempts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
