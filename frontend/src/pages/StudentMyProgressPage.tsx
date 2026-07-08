import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

// ============================================================================
// דף "ההתקדמות שלי" (StudentMyProgressPage)
// ----------------------------------------------------------------------------
// תפקיד:
//   מסך אישי לתלמיד המחובר. מציג סרגל התקדמות לכל קורס (כמה פרקים סיים
//   מתוך הסך, באחוזים), ואת הערות המנהל על התשובות הפתוחות/קבצים שנבדקו לו.
//
// מבנה עיקרי / state:
//   • courses  — סיכום ההתקדמות בכל קורס (מ-GET /me/progress).
//   • feedback — הערות המנהל על תשובות שנבדקו (מ-GET /me/feedback).
//
// הקשר במערכת:
//   route: "/my-progress". פונה ל-GET /me/progress ו-GET /me/feedback.
// ============================================================================

interface CourseProgress {
  course_id: number
  course_title: string
  total_chapters: number
  completed_chapters: number
  percent: number
}

interface Feedback {
  id: number
  course_title: string
  question_text: string
  free_text_answer: string | null
  file_name: string | null
  points_awarded: number | null
  max_points: number | null
  admin_comments: string | null
  submitted_at: string
}

export default function StudentMyProgressPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    // טוענים במקביל: התקדמות הקורסים והערות המנהל
    api.get('/me/progress')
      .then((r) => setCourses(r.data))
      .catch(() => setError('שגיאה בטעינת ההתקדמות'))
    api.get('/me/feedback')
      .then((r) => setFeedback(r.data))
      .catch(() => {})
  }, [])

  return (
    <div className="page">
      <Navbar subtitle="ההתקדמות שלי"
        back={<button className="btn-back" onClick={() => navigate('/')}>← חזרה</button>} />
      <main className="main-content">
        {error && <p className="error-msg">{error}</p>}

        {/* סרגל התקדמות בקורסים */}
        <section className="admin-section">
          <h2>ההתקדמות שלי בקורסים</h2>
          {courses.length === 0 ? (
            <p className="empty-state">עדיין לא התחלת קורסים</p>
          ) : (
            <div className="progress-cards">
              {courses.map((c) => (
                <div key={c.course_id} className="progress-card">
                  <div className="progress-card-head">
                    <h3>{c.course_title}</h3>
                    <span className="spec-count">{c.completed_chapters} / {c.total_chapters} פרקים</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${c.percent}%` }} />
                  </div>
                  <span className="progress-percent">{c.percent}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* הערות המנהל על תשובות שנבדקו */}
        <section className="admin-section">
          <h2>הערות המנהל על התשובות שלי</h2>
          {feedback.length === 0 ? (
            <p className="empty-state">אין עדיין הערות על תשובותיך</p>
          ) : (
            <div className="pending-grade-list">
              {feedback.map((f) => (
                <div key={f.id} className="feedback-item">
                  <span className="spec-count">{f.course_title}</span>
                  <div className="question-box">
                    <span className="question-label">השאלה</span>
                    <p className="question-body">{f.question_text}</p>
                  </div>
                  {f.free_text_answer && (
                    <div className="student-answer-box">
                      <span className="question-label">התשובה שלי</span>
                      <p className="answer-body">{f.free_text_answer}</p>
                    </div>
                  )}
                  {f.file_name && <p className="spec-count">📎 {f.file_name}</p>}
                  {f.points_awarded != null && f.max_points != null && (
                    <p className="feedback-score">ניקוד: <strong>{f.points_awarded} / {f.max_points}</strong></p>
                  )}
                  {f.admin_comments && (
                    <div className="feedback-comment">
                      <span className="question-label">הערת המנהל</span>
                      <p className="answer-body">{f.admin_comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
