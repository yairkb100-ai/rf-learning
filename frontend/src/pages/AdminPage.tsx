import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../api/axios'

interface Course {
  id: number
  title: string
  description: string
  specialization_id: number | null
}

interface Specialization {
  id: number
  name: string
  description?: string
  course_count?: number
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [specs, setSpecs] = useState<Specialization[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [specId, setSpecId] = useState<string>('') // '' = כללי
  const [newSpecName, setNewSpecName] = useState('')
  const [newSpecDesc, setNewSpecDesc] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // רק מנהל
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/')
    }
  }, [user, navigate])

  function loadCourses() {
    api.get('/courses')
      .then((res) => setCourses(res.data))
      .catch(() => setError('שגיאה בטעינת הקורסים'))
      .finally(() => setLoading(false))
  }

  function loadSpecs() {
    api.get('/specializations').then((res) => setSpecs(res.data)).catch(() => {})
  }

  useEffect(() => {
    loadCourses()
    loadSpecs()
  }, [])

  async function handleAddCourse(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return
    try {
      await api.post('/courses', {
        title,
        description,
        specialization_id: specId ? Number(specId) : null,
      })
      setTitle('')
      setDescription('')
      setSpecId('')
      loadCourses()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בהוספת קורס')
    }
  }

  // שינוי שיוך מגמה לקורס קיים ('' = כללי/NULL)
  async function handleChangeSpec(courseId: number, value: string) {
    try {
      await api.put(`/courses/${courseId}`, {
        specialization_id: value ? Number(value) : null,
      })
      loadCourses()
    } catch {
      setError('שגיאה בעדכון מגמת הקורס')
    }
  }

  // שכפול קורס שלם (כולל פרקים, תוכן ושאלות), עם בחירת מגמת יעד
  async function handleDuplicateCourse(course: Course) {
    const opts = ['כללי (לכולם)', ...specs.map((s) => `${s.id}: ${s.name}`)].join('\n')
    const choice = prompt(
      `שכפול הקורס "${course.title}".\nלאיזו מגמה לשייך את העותק?\nהשאר ריק = כללי, או הקלד מספר מגמה:\n\n${opts}`,
      course.specialization_id ? String(course.specialization_id) : ''
    )
    if (choice === null) return // ביטול
    const specialization_id = choice.trim() ? Number(choice.trim()) : null
    try {
      await api.post(`/admin/courses/${course.id}/duplicate`, { specialization_id })
      loadCourses()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בשכפול הקורס')
    }
  }

  // ===== ניהול מגמות =====
  async function handleAddSpec(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!newSpecName.trim()) {
      setError('יש להזין שם מגמה')
      return
    }
    try {
      await api.post('/specializations', { name: newSpecName.trim(), description: newSpecDesc })
      setNewSpecName('')
      setNewSpecDesc('')
      loadSpecs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה ביצירת מגמה')
    }
  }

  // שכפול מגמה כולל כל הקורסים שבה
  async function handleDuplicateSpec(s: Specialization) {
    const name = prompt(`שכפול המגמה "${s.name}" (כולל כל הקורסים שלה).\nשם המגמה החדשה:`, `${s.name} (עותק)`)
    if (name === null) return
    try {
      await api.post(`/admin/specializations/${s.id}/duplicate`, { name: name.trim() || undefined })
      loadSpecs()
      loadCourses()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בשכפול המגמה')
    }
  }

  async function handleDeleteSpec(s: Specialization) {
    if (!confirm(`למחוק את המגמה "${s.name}"?\nהקורסים המשויכים אליה יהפכו לכלליים (לא יימחקו).`)) return
    try {
      await api.delete(`/specializations/${s.id}`)
      loadSpecs()
      loadCourses()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה במחיקת מגמה')
    }
  }

  async function handleDeleteCourse(id: number, courseTitle: string) {
    if (!confirm(`למחוק את הקורס "${courseTitle}"? כל הפרקים והשאלות יימחקו גם.`)) return
    try {
      await api.delete(`/courses/${id}`)
      loadCourses()
    } catch {
      setError('שגיאה במחיקת קורס')
    }
  }

  return (
    <div className="page">
      <Navbar
        subtitle="ניהול"
        back={<button className="btn-back" onClick={() => navigate('/')}>← חזרה</button>}
      />

      <main className="main-content">
        <section className="admin-section" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/admin/dashboard')}>
            📊 דשבורד
          </button>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/admin/users')}>
            👥 ניהול משתמשים ומעקב תלמידים
          </button>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/admin/grading')}>
            ✅ ניקוד ובדיקה
          </button>
        </section>

        {/* ===== ניהול מגמות ===== */}
        <section className="admin-section">
          <h2>ניהול מגמות</h2>
          <form onSubmit={handleAddSpec} className="admin-form">
            <div className="form-group">
              <label>שם מגמה חדשה</label>
              <input
                value={newSpecName}
                onChange={(e) => setNewSpecName(e.target.value)}
                placeholder="לדוגמה: מגמת מחשוב ובקרה"
              />
            </div>
            <div className="form-group">
              <label>תיאור (אופציונלי)</label>
              <input
                value={newSpecDesc}
                onChange={(e) => setNewSpecDesc(e.target.value)}
                placeholder="תיאור קצר של המגמה"
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary">צור מגמה</button>
          </form>

          <div className="admin-courses-list" style={{ marginTop: 18 }}>
            {specs.length === 0 && <p className="empty-state">אין מגמות עדיין</p>}
            {specs.map((s) => (
              <div key={s.id} className="admin-course-item">
                <div className="admin-course-info">
                  <h3>🎓 {s.name}</h3>
                  {s.description && <p>{s.description}</p>}
                  <span className="spec-count">{s.course_count ?? 0} קורסים</span>
                </div>
                <div className="admin-course-actions">
                  <button className="btn-secondary" onClick={() => handleDuplicateSpec(s)}>שכפל</button>
                  <button className="btn-danger" onClick={() => handleDeleteSpec(s)}>מחק</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <h2>הוספת קורס חדש</h2>
          <form onSubmit={handleAddCourse} className="admin-form">
            <div className="form-group">
              <label>שם הקורס</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="לדוגמה: יסודות התקשורת"
                required
              />
            </div>
            <div className="form-group">
              <label>תיאור</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="תיאור קצר של הקורס"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>מגמה</label>
              <select value={specId} onChange={(e) => setSpecId(e.target.value)}>
                <option value="">כללי — לכל התלמידים</option>
                {specs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary">הוסף קורס</button>
          </form>
        </section>

        <section className="admin-section">
          <h2>הקורסים הקיימים</h2>
          {loading && <p className="loading">טוען...</p>}
          {!loading && courses.length === 0 && (
            <p className="empty-state">אין קורסים עדיין</p>
          )}
          <div className="admin-courses-list">
            {courses.map((course) => (
              <div key={course.id} className="admin-course-item">
                <div className="admin-course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <label className="admin-course-spec">
                    מגמה:
                    <select
                      value={course.specialization_id ?? ''}
                      onChange={(e) => handleChangeSpec(course.id, e.target.value)}
                    >
                      <option value="">כללי (לכולם)</option>
                      {specs.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="admin-course-actions">
                  <button
                    className="btn-outline"
                    onClick={() => navigate(`/admin/courses/${course.id}/chapters`)}
                  >
                    פרקים
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => navigate(`/admin/courses/${course.id}/chapters`)}
                  >
                    חומר לימוד
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => navigate(`/admin/courses/${course.id}/chapters`)}
                  >
                    ניהול שאלות
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleDuplicateCourse(course)}
                  >
                    שכפל
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteCourse(course.id, course.title)}
                  >
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
