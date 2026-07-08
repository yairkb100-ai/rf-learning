import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

// ============================================================================
// דף הבית (HomePage)
// ----------------------------------------------------------------------------
// תפקיד:
//   המסך הראשי לאחר התחברות. מציג את רשימת המגמות (התמחויות) ואת הקורסים
//   הכלליים (ללא שיוך למגמה). המשתמש בוחר מגמה כדי לצפות בקורסים שלה, או
//   נכנס ישירות לקורס כללי. מנהל רואה גם כפתור "ניהול".
//
// מבנה עיקרי / state:
//   • specs          — רשימת המגמות.
//   • generalCourses — קורסים כלליים (משותפים לכולם).
//   • loading/error  — מצבי טעינה ושגיאה.
//
// הקשר במערכת:
//   route: "/". פונה ל-GET /specializations ו-GET /courses?general=1.
//   כולל Navbar + Sidebar (עץ הקורסים).
// ============================================================================

interface Specialization {
  id: number
  name: string
  description: string
  course_count: number
}

interface Course {
  id: number
  title: string
  description: string
  specialization_id: number | null
}

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [specs, setSpecs] = useState<Specialization[]>([])
  const [generalCourses, setGeneralCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // טוענים במקביל: רשימת מגמות + הקורסים הכלליים (ללא מגמה)
    Promise.all([
      api.get('/specializations'),
      api.get('/courses', { params: { general: 1 } }),
    ])
      .then(([sRes, cRes]) => {
        setSpecs(sRes.data)
        setGeneralCourses(cRes.data)
      })
      .catch(() => setError('שגיאה בטעינת הנתונים'))
      .finally(() => setLoading(false))
  }, [])

  // התנתקות: מנקה את ההזדהות ומנווט למסך ההתחברות.
  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="page">
      {/* סרגל עליון: ברכה, כפתור ניהול (למנהל בלבד) וכפתור התנתקות */}
      <Navbar
        left={
          <>
            <span>שלום, {user?.full_name}</span>
            <button className="btn-secondary" onClick={() => navigate('/my-progress')}>
              📊 ההתקדמות שלי
            </button>
            {user?.role === 'ADMIN' && (
              <button className="btn-secondary" onClick={() => navigate('/admin')}>
                ניהול
              </button>
            )}
            <button className="btn-outline" onClick={handleLogout}>
              התנתק
            </button>
          </>
        }
      />

      <div className="page-with-sidebar">
        <Sidebar />
        <main className="main-content">
          {loading && <p className="loading">טוען...</p>}
          {error && <p className="error-msg">{error}</p>}

          {!loading && !error && (
            <>
              {/* מגמות */}
              <h2>מגמות</h2>
              {specs.length === 0 && (
                <p className="empty-state">אין מגמות זמינות כרגע</p>
              )}
              <div className="courses-grid">
                {specs.map((s) => (
                  <div
                    key={s.id}
                    className="course-card spec-card"
                    onClick={() => navigate(`/specializations/${s.id}`)}
                  >
                    <h3>🎓 {s.name}</h3>
                    <p>{s.description}</p>
                    <span className="spec-count">{s.course_count} קורסים</span>
                    <button className="btn-primary">כניסה למגמה</button>
                  </div>
                ))}
              </div>

              {/* קורסים כלליים — משותפים לכולם */}
              {generalCourses.length > 0 && (
                <>
                  <h2 className="section-gap">קורסים כלליים</h2>
                  <div className="courses-grid">
                    {generalCourses.map((course) => (
                      <div
                        key={course.id}
                        className="course-card"
                        onClick={() => navigate(`/courses/${course.id}`)}
                      >
                        <h3>{course.title}</h3>
                        <p>{course.description}</p>
                        <button className="btn-primary">כנס לקורס</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
