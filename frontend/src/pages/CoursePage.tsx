import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ContentViewer from '../components/ContentViewer'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface Chapter {
  id: number
  title: string
  description: string
  order_number: number
}

interface ContentItem {
  id: number
  content_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'PDF' | 'LINK' | 'RICH'
  title: string
  content: string
  extra?: string | null
}

interface Progress {
  total_chapters: number
  completed_chapters: number
  percent: number
  chapters: { chapter_id: number; is_completed: boolean }[]
}

interface Course {
  id: number
  title: string
  description: string
  level: string
}

export default function CoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/chapters`),
      api.get(`/courses/${courseId}/progress`),
      api.get(`/courses/${courseId}/content`),
    ])
      .then(([courseRes, chaptersRes, progressRes, contentRes]) => {
        setCourse(courseRes.data)
        setChapters(chaptersRes.data)
        setProgress(progressRes.data)
        setContent(contentRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [courseId])

  async function toggleChapter(chapterId: number, isDone: boolean) {
    try {
      if (isDone) {
        await api.delete(`/courses/${courseId}/progress/${chapterId}/complete`)
      } else {
        await api.post(`/courses/${courseId}/progress/${chapterId}/complete`)
      }
      const res = await api.get(`/courses/${courseId}/progress`)
      setProgress(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  function isChapterDone(chapterId: number) {
    return progress?.chapters.some(
      (p) => p.chapter_id === chapterId && p.is_completed
    ) ?? false
  }

  if (loading) return <div className="loading">טוען...</div>
  if (!course) return <div className="error-msg">קורס לא נמצא</div>

  return (
    <div className="page">
      <Navbar
        subtitle={course.title}
        back={<button className="btn-back" onClick={() => navigate('/')}>← חזרה</button>}
      />

      <div className="page-with-sidebar">
        <Sidebar />
        <main className="main-content course-udemy">
        {/* Hero — בסגנון Udemy */}
        <section className="course-hero">
          <div className="course-hero-main">
            {course.level && <span className="course-level-badge">{course.level}</span>}
            <h1 className="course-hero-title">{course.title}</h1>
            <p className="course-hero-desc">{course.description}</p>
            {progress && (
              <div className="course-hero-meta">
                <span>📚 {progress.total_chapters} פרקים</span>
                <span className="dot">•</span>
                <span>✓ {progress.completed_chapters} הושלמו</span>
                <span className="dot">•</span>
                <span>{progress.percent}% מהקורס</span>
              </div>
            )}
          </div>
        </section>

        <div className="course-body">
          {/* עמודה ראשית */}
          <div className="course-main-col">
            {(content.length > 0 || isAdmin) && (
              <section className="course-intro">
                <div className="section-head">
                  <h2>📚 מבוא וחומר לימוד</h2>
                  {isAdmin && (
                    <button
                      className="btn-outline"
                      onClick={() => navigate(`/admin/courses/${courseId}/content`)}
                    >
                      ＋ הוסף / ערוך חומר וקבצים
                    </button>
                  )}
                </div>
                {content.length > 0 ? (
                  <div className="content-list">
                    {content.map((item) => (
                      <ContentViewer key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  isAdmin && (
                    <p className="empty-state">
                      אין עדיין חומר לקורס. לחץ "הוסף / ערוך חומר וקבצים" כדי להעלות טקסט, תמונות,
                      וידאו או קבצים (PDF / Word / Excel).
                    </p>
                  )
                )}
              </section>
            )}

            <section className="course-content-section">
              <h2>תוכן הקורס</h2>
              <p className="course-content-sub">
                {chapters.length} פרקים
                {progress ? ` · ${progress.completed_chapters}/${progress.total_chapters} הושלמו` : ''}
              </p>

              <div className="curriculum">
                {chapters.map((chapter) => {
                  const done = isChapterDone(chapter.id)
                  return (
                    <div
                      key={chapter.id}
                      className={`curriculum-row ${done ? 'done' : ''}`}
                      onClick={() => navigate(`/courses/${courseId}/chapters/${chapter.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <span
                        className={`curriculum-check ${done ? 'checked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleChapter(chapter.id, done) }}
                        title={done ? 'בטל סימון' : 'סמן כהושלם'}
                        role="checkbox"
                        aria-checked={done}
                      >
                        {done ? '✓' : ''}
                      </span>
                      <span className="curriculum-num">{chapter.order_number}</span>
                      <div className="curriculum-text">
                        <h3>{chapter.title}</h3>
                        {chapter.description && <p>{chapter.description}</p>}
                      </div>
                      <span className="curriculum-enter">פתח ←</span>
                    </div>
                  )
                })}
              </div>

              {chapters.length === 0 && (
                <p className="empty-state">אין פרקים בקורס זה עדיין</p>
              )}
            </section>
          </div>

          {/* עמודת התקדמות דביקה — בסגנון Udemy */}
          {progress && (
            <aside className="course-side-col">
              <div className="progress-card">
                <div className="progress-card-percent">{progress.percent}%</div>
                <div className="progress-card-label">הושלם</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
                </div>
                <div className="progress-card-detail">
                  {progress.completed_chapters} מתוך {progress.total_chapters} פרקים
                </div>
                {chapters.length > 0 && (
                  <button
                    className="btn-primary btn-block"
                    onClick={() => {
                      const next = chapters.find((c) => !isChapterDone(c.id)) ?? chapters[0]
                      navigate(`/courses/${courseId}/chapters/${next.id}`)
                    }}
                  >
                    {progress.completed_chapters > 0 ? 'המשך ללמוד' : 'התחל ללמוד'}
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
        </main>
      </div>
    </div>
  )
}
