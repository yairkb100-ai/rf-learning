import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

// ============================================================================
// דף מגמה (SpecializationPage)
// ----------------------------------------------------------------------------
// תפקיד:
//   מציג את פרטי מגמה בודדת (שם ותיאור) ואת רשימת הקורסים המשויכים אליה.
//   לחיצה על קורס מנווטת לדף הקורס.
//
// מבנה עיקרי / state:
//   • spec    — פרטי המגמה הנוכחית (נמצאת לפי specializationId מה-URL).
//   • courses — קורסי המגמה.
//
// הקשר במערכת:
//   route: "/specializations/:specializationId". פונה ל-GET /specializations
//   ו-GET /courses?specialization_id=...
// ============================================================================

interface Specialization {
  id: number
  name: string
  description: string
}

interface Course {
  id: number
  title: string
  description: string
}

export default function SpecializationPage() {
  const { specializationId } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [spec, setSpec] = useState<Specialization | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // בטעינה (ובכל שינוי מגמה ב-URL): טוען במקביל את כל המגמות ואת קורסי המגמה,
  // ומאתר מתוך המגמות את המגמה המבוקשת לפי המזהה שב-URL.
  useEffect(() => {
    Promise.all([
      api.get('/specializations'),
      api.get('/courses', { params: { specialization_id: specializationId } }),
    ])
      .then(([sRes, cRes]) => {
        setSpec(sRes.data.find((s: Specialization) => String(s.id) === specializationId) || null)
        setCourses(cRes.data)
      })
      .catch(() => setError('שגיאה בטעינת המגמה'))
      .finally(() => setLoading(false))
  }, [specializationId])

  // התנתקות: מנקה את ההזדהות ומנווט למסך ההתחברות.
  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="page">
      <Navbar
        left={
          <>
            <span>שלום, {user?.full_name}</span>
            <button className="btn-outline" onClick={handleLogout}>התנתק</button>
          </>
        }
      />

      <div className="page-with-sidebar">
        <Sidebar />
        <main className="main-content">
          <button className="btn-outline back-link" onClick={() => navigate('/')}>
            → חזרה למגמות
          </button>

          {loading && <p className="loading">טוען...</p>}
          {error && <p className="error-msg">{error}</p>}

          {!loading && !error && (
            <>
              <h2>🎓 {spec?.name || 'מגמה'}</h2>
              {spec?.description && <p className="spec-page-desc">{spec.description}</p>}

              {courses.length === 0 ? (
                <p className="empty-state">אין קורסים במגמה זו כרגע</p>
              ) : (
                <div className="courses-grid">
                  {courses.map((course) => (
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
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
