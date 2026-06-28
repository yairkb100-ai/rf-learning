import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

interface Course {
  id: number
  title: string
}

interface Chapter {
  id: number
  title: string
  order_number: number
}

export default function Sidebar() {
  const navigate = useNavigate()
  // courseId/chapterId מה-URL הנוכחי (אם קיימים) — לסימון הפעיל ופתיחה אוטומטית
  const { courseId, chapterId } = useParams()

  const [courses, setCourses] = useState<Course[]>([])
  const [openCourseId, setOpenCourseId] = useState<number | null>(null)
  // מטמון פרקים לכל קורס שכבר נפתח
  const [chaptersByCourse, setChaptersByCourse] = useState<Record<number, Chapter[]>>({})
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    api.get('/courses')
      .then((res) => setCourses(res.data))
      .catch(() => {})
  }, [])

  // אם נכנסנו לקורס דרך ה-URL — פותחים אותו אוטומטית
  useEffect(() => {
    if (courseId) {
      const id = Number(courseId)
      setOpenCourseId(id)
      loadChapters(id)
    }
  }, [courseId])

  function loadChapters(id: number) {
    if (chaptersByCourse[id]) return // כבר נטען
    api.get(`/courses/${id}/chapters`)
      .then((res) => setChaptersByCourse((prev) => ({ ...prev, [id]: res.data })))
      .catch(() => {})
  }

  function toggleCourse(id: number) {
    if (openCourseId === id) {
      setOpenCourseId(null)
    } else {
      setOpenCourseId(id)
      loadChapters(id)
    }
  }

  function go(path: string) {
    navigate(path)
    setMobileOpen(false) // סגירת התפריט בנייד אחרי ניווט
  }

  return (
    <>
      {/* כפתור המבורגר — מוצג רק במסך צר */}
      <button
        className="sidebar-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="תפריט קורסים"
      >
        ☰
      </button>

      {/* רקע כהה מאחורי התפריט בנייד */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">📚 הקורסים</div>
        <nav className="sidebar-nav">
          {courses.length === 0 && <p className="sidebar-empty">אין קורסים</p>}
          {courses.map((course) => {
            const isOpen = openCourseId === course.id
            const isActiveCourse = Number(courseId) === course.id
            const chapters = chaptersByCourse[course.id] || []
            return (
              <div key={course.id} className="sidebar-course">
                <button
                  className={`sidebar-course-btn ${isActiveCourse ? 'active' : ''}`}
                  onClick={() => toggleCourse(course.id)}
                >
                  <span className="sidebar-arrow">{isOpen ? '▾' : '▸'}</span>
                  <span className="sidebar-course-title">{course.title}</span>
                </button>

                {isOpen && (
                  <div className="sidebar-chapters">
                    <button
                      className="sidebar-chapter-btn course-overview"
                      onClick={() => go(`/courses/${course.id}`)}
                    >
                      ← עמוד הקורס
                    </button>
                    {chapters.length === 0 && (
                      <p className="sidebar-empty small">אין פרקים</p>
                    )}
                    {chapters.map((ch) => (
                      <button
                        key={ch.id}
                        className={`sidebar-chapter-btn ${Number(chapterId) === ch.id ? 'active' : ''}`}
                        onClick={() => go(`/courses/${course.id}/chapters/${ch.id}`)}
                      >
                        {ch.order_number}. {ch.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
