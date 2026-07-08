import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

// ============================================================================
// דף התקדמות תלמיד (StudentProgressPage)
// ----------------------------------------------------------------------------
// תפקיד:
//   מסך מפורט למנהל על תלמיד בודד: פרטיו, תשובות הממתינות לבדיקה (עם טופס דירוג),
//   הפרקים שהשלים (מקובצים לפי קורס) וניסיונות המבחן שלו. כן פעולות ניהול:
//   איפוס סיסמה ואיפוס כל נתוני התלמיד.
//
// מבנה עיקרי / state:
//   • data                — פרטי התלמיד, פרקיו וניסיונות המבחן.
//   • pending + selected  — תשובות ממתינות לבדיקה וטופס הדירוג לתשובה הנבחרת.
//   • byCourse            — הפרקים מקובצים לפי שם קורס לתצוגה.
//
// הקשר במערכת:
//   route: "/admin/students/:id". פונה ל-GET /admin/students/:id/progress,
//   /admin/grading/pending, ול-POST/PUT של submit / reset-password / reset-data.
// ============================================================================

interface Detail {
  student: { id: number; full_name: string; username: string; specialization_name: string | null }
  chapters: { course_id: number; course_title: string; chapter_id: number; chapter_title: string; is_completed: boolean; completed_at: string | null }[]
  exam_attempts: { id: number; course_title: string; score: number; status: string; submitted_at: string }[]
}

interface PendingGrade {
  id: number
  student_id: number
  course_title: string
  question_text: string
  question_type: 'FREE_TEXT' | 'FILE_UPLOAD'
  model_answer: string | null
  free_text_answer: string | null
  file_path: string | null
  file_name: string | null
}

const PW_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,8}$/

export default function StudentProgressPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // רק מנהל
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/')
    }
  }, [user, navigate])

  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  // ניקוד תשובות ממתינות של התלמיד הזה
  const [pending, setPending] = useState<PendingGrade[]>([])
  const [selected, setSelected] = useState<PendingGrade | null>(null)
  const [ratingChoice, setRatingChoice] = useState<'full' | 'partial' | 'zero' | null>(null)
  const [partialScore, setPartialScore] = useState(50)
  const [comments, setComments] = useState('')

  const finalScore =
    ratingChoice === 'full' ? 100 :
    ratingChoice === 'zero' ? 0 :
    ratingChoice === 'partial' ? partialScore : null

  // טוען את כל נתוני הדף: התקדמות התלמיד ותשובותיו הממתינות לבדיקה.
  function loadAll() {
    api.get(`/admin/students/${id}/progress`)
      .then((r) => setData(r.data))
      .catch(() => setError('שגיאה בטעינת ההתקדמות'))
    // התור הכללי, מסונן לתלמיד הנוכחי (השרת כבר מסנן לפי הרשאות המנהל)
    api.get('/admin/grading/pending')
      .then((r) => setPending(r.data.filter((g: PendingGrade) => String(g.student_id) === String(id))))
      .catch(() => {})
  }
  useEffect(() => { loadAll() }, [id])

  // שמירת ניקוד לתשובה שנבחרה (POST /admin/grading/:id/submit).
  async function submitGrade() {
    if (!selected || finalScore === null) { setError('יש לבחור דירוג'); return }
    try {
      await api.post(`/admin/grading/${selected.id}/submit`, { score: finalScore, comments })
      setSelected(null); setRatingChoice(null); setPartialScore(50); setComments('')
      setOk('הניקוד נשמר בהצלחה')
      loadAll()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בשמירת הניקוד')
    }
  }

  // איפוס סיסמת התלמיד (PUT /admin/users/:id/reset-password) עם ולידציית סיסמה.
  async function handleResetPassword() {
    if (!data) return
    setError(''); setOk('')
    const pw = prompt(`איפוס סיסמה ל${data.student.full_name} (${data.student.username}).\nסיסמה חדשה (אות גדולה+קטנה+מספר, 6–8 תווים):`)
    if (pw === null) return
    if (!PW_RE.test(pw)) { setError('הסיסמה חייבת להכיל אות גדולה, אות קטנה ומספר, באורך 6 עד 8 תווים'); return }
    try {
      await api.put(`/admin/users/${data.student.id}/reset-password`, { password: pw })
      setOk('הסיסמה אופסה בהצלחה')
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה באיפוס הסיסמה')
    }
  }

  // איפוס כל נתוני התלמיד — התקדמות, ניסיונות ותשובות (POST /admin/students/:id/reset-data).
  // פעולה בלתי הפיכה, ולכן מבקשת אישור.
  async function handleResetData() {
    if (!data) return
    setError(''); setOk('')
    if (!confirm(`לאפס את כל הנתונים של ${data.student.full_name}?\nיימחקו: התקדמות הפרקים, ניסיונות המבחן והתשובות. פעולה זו אינה הפיכה.`)) return
    try {
      await api.post(`/admin/students/${data.student.id}/reset-data`)
      setOk('נתוני התלמיד אופסו בהצלחה')
      loadAll()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה באיפוס הנתונים')
    }
  }

  // קיבוץ פרקים לפי קורס
  const byCourse: Record<string, Detail['chapters']> = {}
  data?.chapters.forEach((c) => {
    (byCourse[c.course_title] ||= []).push(c)
  })

  return (
    <div className="page">
      <Navbar subtitle="התקדמות תלמיד"
        back={<button className="btn-back" onClick={() => navigate('/admin/users')}>← חזרה למשתמשים</button>} />
      <main className="main-content">
        {error && <p className="error-msg">{error}</p>}
        {ok && <p className="success-msg">{ok}</p>}
        {data && (
          <>
            <section className="admin-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2>{data.student.full_name}</h2>
                  <p dir="ltr">{data.student.username}</p>
                  <p className="spec-count">מגמה: {data.student.specialization_name || 'ללא'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-outline" onClick={handleResetPassword}>🔑 אפס סיסמה</button>
                  <button className="btn-danger" onClick={handleResetData}>🗑️ אפס נתונים</button>
                </div>
              </div>
            </section>

            {/* תשובות הממתינות לבדיקה */}
            <section className="admin-section">
              <h2>תשובות לבדיקה ({pending.length})</h2>
              {pending.length === 0 ? (
                <p className="empty-state">אין תשובות הממתינות לבדיקה לתלמיד זה 🎉</p>
              ) : selected ? (
                <div className="grading-form">
                  <p className="spec-count">קורס: {selected.course_title}</p>
                  <div className="question-box">
                    <span className="question-label">השאלה</span>
                    <p className="question-body">{selected.question_text}</p>
                  </div>
                  {selected.model_answer && (
                    <p style={{ margin: '8px 0' }}><strong>תשובת מודל:</strong> {selected.model_answer}</p>
                  )}
                  {selected.question_type === 'FREE_TEXT' && (
                    <div className="student-answer-box">
                      <span className="question-label">תשובת התלמיד</span>
                      <p className="answer-body">{selected.free_text_answer}</p>
                    </div>
                  )}
                  {selected.question_type === 'FILE_UPLOAD' && (
                    <a href={selected.file_path || '#'} target="_blank" rel="noreferrer" className="btn-outline" style={{ display: 'inline-block', margin: '8px 0' }}>
                      📎 {selected.file_name}
                    </a>
                  )}

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '12px 0' }}>
                    <button type="button" className={`btn-outline ${ratingChoice === 'full' ? 'btn-primary' : ''}`} onClick={() => setRatingChoice('full')}>✅ תשובה מלאה (100%)</button>
                    <button type="button" className={`btn-outline ${ratingChoice === 'partial' ? 'btn-primary' : ''}`} onClick={() => setRatingChoice('partial')}>➗ תשובה חלקית</button>
                    <button type="button" className={`btn-outline ${ratingChoice === 'zero' ? 'btn-primary' : ''}`} onClick={() => setRatingChoice('zero')}>❌ תשובה שגויה (0%)</button>
                  </div>
                  {ratingChoice === 'partial' && (
                    <div className="form-group">
                      <label>אחוז נכונות:</label>
                      <select value={partialScore} onChange={(e) => setPartialScore(Number(e.target.value))}>
                        <option value={25}>25%</option>
                        <option value={50}>50%</option>
                        <option value={75}>75%</option>
                      </select>
                    </div>
                  )}
                  {finalScore !== null && <p>ניקוד סופי: <strong>{finalScore}</strong> מתוך 100</p>}
                  <div className="form-group">
                    <label>הערות:</label>
                    <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={2} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-primary" onClick={submitGrade}>שמור ניקוד</button>
                    <button className="btn-outline" onClick={() => { setSelected(null); setRatingChoice(null) }}>ביטול</button>
                  </div>
                </div>
              ) : (
                <div className="pending-grade-list">
                  {pending.map((g) => (
                    <div key={g.id} className="pending-grade-item">
                      <div className="pending-grade-text">
                        <span className="spec-count">{g.question_type === 'FREE_TEXT' ? '📝 שאלה פתוחה' : '📎 קובץ'} · {g.course_title}</span>
                        <p className="question-body">{g.question_text}</p>
                      </div>
                      <button className="btn-primary" onClick={() => { setSelected(g); setRatingChoice(null); setPartialScore(50); setComments('') }}>בדוק</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="admin-section">
              <h2>פרקים שהושלמו</h2>
              {Object.keys(byCourse).length === 0 ? (
                <p className="empty-state">התלמיד עדיין לא השלים פרקים</p>
              ) : (
                Object.entries(byCourse).map(([course, chaps]) => (
                  <div key={course} style={{ marginBottom: 16 }}>
                    <h3>{course}</h3>
                    <ul className="progress-list">
                      {chaps.map((c) => (
                        <li key={c.chapter_id}>
                          {c.is_completed ? '✅' : '⬜'} {c.chapter_title}
                          {c.completed_at && <span className="spec-count"> — {new Date(c.completed_at).toLocaleDateString('he-IL')}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>

            <section className="admin-section">
              <h2>ניסיונות מבחן</h2>
              {data.exam_attempts.length === 0 ? (
                <p className="empty-state">אין ניסיונות מבחן</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>קורס</th><th>ציון</th><th>סטטוס</th><th>תאריך</th></tr></thead>
                  <tbody>
                    {data.exam_attempts.map((a) => (
                      <tr key={a.id}>
                        <td>{a.course_title}</td>
                        <td>{a.score}%</td>
                        <td>{a.status === 'PENDING_REVIEW' ? 'ממתין לבדיקה' : 'נבדק'}</td>
                        <td>{new Date(a.submitted_at).toLocaleString('he-IL')}</td>
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
