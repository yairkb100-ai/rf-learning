import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

// ============================================================================
// דף ניקוד ובדיקה (AdminGradingPage)
// ----------------------------------------------------------------------------
// תפקיד:
//   מסך למנהל לבדיקת תשובות פתוחות/קבצים שהוגשו במבחנים. שתי לשוניות:
//   "ממתינים לבדיקה" — רשימת תשובות לבדיקה + טופס דירוג (מלא/חלקי/שגוי + הערות),
//   ו-"הסטודנטים שלי" — כרטיסי הסטודנטים המשויכים למנהל עם סטטיסטיקה.
//
// מבנה עיקרי / state:
//   • tab                — הלשונית הפעילה ('pending' / 'students').
//   • pendingList / studentList — נתוני שתי הלשוניות.
//   • selectedGrade + ratingChoice/partialScore/comments — טופס בדיקת תשובה בודדת.
//   • finalScore         — הציון הסופי (0–100) הנגזר מבחירת הדירוג.
//
// הקשר במערכת:
//   route: "/admin/grading". פונה ל-GET /admin/grading/pending, /admin/my-students,
//   ול-POST /admin/grading/:id/submit לשמירת הניקוד.
// ============================================================================

interface PendingGrade {
  id: number
  attempt_id: number
  question_id: number
  student_id: number
  student_name: string
  course_title: string
  question_text: string
  question_type: 'FREE_TEXT' | 'FILE_UPLOAD'
  model_answer: string | null
  free_text_answer: string | null
  file_path: string | null
  file_name: string | null
  created_at: string
  status: string
}

interface StudentInfo {
  id: number
  full_name: string
  national_id: string
  email: string
  total_attempts: number
  pending_grading: number
}

export default function AdminGradingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // רק מנהל
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/')
    }
  }, [user, navigate])

  const [tab, setTab] = useState<'pending' | 'students'>('pending')
  const [pendingList, setPendingList] = useState<PendingGrade[]>([])
  const [studentList, setStudentList] = useState<StudentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // grading form
  const [selectedGrade, setSelectedGrade] = useState<PendingGrade | null>(null)
  // דירוג: null=טרם נבחר, 'full'=100, 'partial'=25/50/75, 'zero'=0
  const [ratingChoice, setRatingChoice] = useState<'full' | 'partial' | 'zero' | null>(null)
  const [partialScore, setPartialScore] = useState<number>(50)
  const [comments, setComments] = useState('')
  const [submittingGrade, setSubmittingGrade] = useState(false)

  // הציון הסופי (0-100) לפי בחירת הדירוג — נשמר כמספר לשקלול הרגיל
  const finalScore =
    ratingChoice === 'full' ? 100 :
    ratingChoice === 'zero' ? 0 :
    ratingChoice === 'partial' ? partialScore : null

  // בכל החלפת לשונית — טוען מחדש את הנתונים המתאימים ללשונית.
  useEffect(() => {
    loadData()
  }, [tab])

  // טוען את הנתונים לפי הלשונית הפעילה: תשובות ממתינות או רשימת הסטודנטים.
  async function loadData() {
    setLoading(true)
    try {
      if (tab === 'pending') {
        const res = await api.get('/admin/grading/pending')
        setPendingList(res.data)
      } else {
        const res = await api.get('/admin/my-students')
        setStudentList(res.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  // שמירת ניקוד לתשובה שנבחרה (POST /admin/grading/:id/submit) — שולח ציון והערות,
  // מאפס את טופס הבדיקה וטוען מחדש את הרשימה.
  async function submitGrade() {
    if (!selectedGrade) return
    if (finalScore === null) {
      alert('יש לבחור דירוג לתשובה')
      return
    }

    setSubmittingGrade(true)
    try {
      await api.post(`/admin/grading/${selectedGrade.id}/submit`, {
        score: finalScore,
        comments,
      })
      setSelectedGrade(null)
      setRatingChoice(null)
      setPartialScore(50)
      setComments('')
      loadData()
      alert('הניקוד נשמר בהצלחה!')
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בשמירת הניקוד')
    } finally {
      setSubmittingGrade(false)
    }
  }

  if (loading) return <div className="loading">טוען...</div>

  return (
    <div className="page">
      <Navbar subtitle="ניהול ניקוד" />
      <main className="main-content">
        <div className="tabs">
          <button
            className={`tab ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => setTab('pending')}
          >
            🕐 ממתינים לבדיקה ({pendingList.length})
          </button>
          <button
            className={`tab ${tab === 'students' ? 'active' : ''}`}
            onClick={() => setTab('students')}
          >
            👥 הסטודנטים שלי ({studentList.length})
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        {tab === 'pending' && (
          <div className="grading-section">
            {pendingList.length === 0 ? (
              <p className="empty-state">אין שאלות ממתינות לבדיקה! 🎉</p>
            ) : (
              <>
                {selectedGrade ? (
                  <div className="grading-form">
                    <h3>בדיקת שאלה</h3>
                    <div className="grading-details">
                      <p><strong>סטודנט:</strong> {selectedGrade.student_name}</p>
                      <p><strong>קורס:</strong> {selectedGrade.course_title}</p>
                      <p><strong>שאלה:</strong> {selectedGrade.question_text}</p>
                      {selectedGrade.model_answer && (
                        <p><strong>תשובה מודל:</strong> {selectedGrade.model_answer}</p>
                      )}

                      {selectedGrade.question_type === 'FREE_TEXT' && (
                        <div className="student-answer">
                          <p><strong>תשובת הסטודנט:</strong></p>
                          <div className="answer-box">{selectedGrade.free_text_answer}</div>
                        </div>
                      )}

                      {selectedGrade.question_type === 'FILE_UPLOAD' && (
                        <div className="file-answer">
                          <p><strong>קובץ שהעלה:</strong></p>
                          <a href={selectedGrade.file_path || '#'} target="_blank" rel="noreferrer" className="file-link">
                            📎 {selectedGrade.file_name}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="grade-input-group">
                      <label>דירוג התשובה:</label>
                      <div className="rating-buttons">
                        <button
                          type="button"
                          className={`rating-btn full ${ratingChoice === 'full' ? 'selected' : ''}`}
                          onClick={() => setRatingChoice('full')}
                        >
                          ✅ תשובה מלאה (100%)
                        </button>
                        <button
                          type="button"
                          className={`rating-btn partial ${ratingChoice === 'partial' ? 'selected' : ''}`}
                          onClick={() => setRatingChoice('partial')}
                        >
                          ➗ תשובה חלקית
                        </button>
                        <button
                          type="button"
                          className={`rating-btn zero ${ratingChoice === 'zero' ? 'selected' : ''}`}
                          onClick={() => setRatingChoice('zero')}
                        >
                          ❌ תשובה שגויה (0%)
                        </button>
                      </div>

                      {ratingChoice === 'partial' && (
                        <label>
                          אחוז נכונות:
                          <select
                            value={partialScore}
                            onChange={(e) => setPartialScore(Number(e.target.value))}
                          >
                            <option value={25}>25%</option>
                            <option value={50}>50%</option>
                            <option value={75}>75%</option>
                          </select>
                        </label>
                      )}

                      {finalScore !== null && (
                        <p className="final-score-preview">ניקוד סופי: <strong>{finalScore}</strong> מתוך 100</p>
                      )}

                      <label>
                        הערות:
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="כתוב הערות על תשובת הסטודנט..."
                          rows={3}
                        />
                      </label>
                    </div>

                    <div className="form-actions">
                      <button
                        className="btn-primary"
                        onClick={submitGrade}
                        disabled={submittingGrade}
                      >
                        {submittingGrade ? 'שומר...' : 'שמור ניקוד'}
                      </button>
                      <button className="btn-outline" onClick={() => { setSelectedGrade(null); setRatingChoice(null) }}>
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pending-list">
                    {pendingList.map((item) => (
                      <div key={item.id} className="grading-item">
                        <div className="item-info">
                          <h4>{item.student_name}</h4>
                          <p className="course-name">{item.course_title}</p>
                          <p className="question-text">{item.question_text}</p>
                          <p className="question-type">
                            {item.question_type === 'FREE_TEXT' ? '📝 שאלה פתוחה' : '📎 העלאת קובץ'}
                          </p>
                          <p className="timestamp">
                            {new Date(item.created_at).toLocaleString('he-IL')}
                          </p>
                        </div>
                        <button
                          className="btn-primary"
                          onClick={() => {
                            setSelectedGrade(item)
                            setRatingChoice(null)
                            setPartialScore(50)
                            setComments('')
                          }}
                        >
                          בדוק
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'students' && (
          <div className="students-section">
            {studentList.length === 0 ? (
              <p className="empty-state">אין סטודנטים המוקצים אליך</p>
            ) : (
              <div className="students-grid">
                {studentList.map((student) => (
                  <div key={student.id} className="student-card">
                    <h4>{student.full_name}</h4>
                    <p className="id">{student.national_id}</p>
                    <p className="email">{student.email}</p>
                    <div className="stats">
                      <div className="stat">
                        <span className="value">{student.total_attempts}</span>
                        <span className="label">בחנים</span>
                      </div>
                      <div className="stat">
                        <span className="value" style={{ color: '#e74c3c' }}>
                          {student.pending_grading}
                        </span>
                        <span className="label">ממתינים</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #ddd;
        }

        .tab {
          padding: 10px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1rem;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .tab.active {
          color: #a435f0;
          border-bottom-color: #a435f0;
        }

        .grading-form {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .grading-details {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }

        .student-answer, .file-answer {
          margin-top: 10px;
        }

        .answer-box {
          background: white;
          padding: 10px;
          border-left: 4px solid #a435f0;
          border-radius: 3px;
          margin-top: 5px;
        }

        .file-link {
          display: inline-block;
          padding: 8px 15px;
          background: #a435f0;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          transition: background 0.3s;
        }

        .file-link:hover {
          background: #8e2ea3;
        }

        .grade-input-group {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin: 20px 0;
        }

        .grade-input-group label {
          display: flex;
          flex-direction: column;
          font-weight: 600;
          gap: 5px;
        }

        .grade-input-group input,
        .grade-input-group textarea,
        .grade-input-group select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
          font-family: inherit;
        }

        .rating-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .rating-btn {
          flex: 1;
          min-width: 140px;
          padding: 14px 10px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .rating-btn:hover { border-color: #a435f0; }

        .rating-btn.full.selected { background: #e6f7ec; border-color: #2e7d32; color: #2e7d32; }
        .rating-btn.partial.selected { background: #fff8e1; border-color: #f9a825; color: #b8860b; }
        .rating-btn.zero.selected { background: #fdecea; border-color: #c62828; color: #c62828; }

        .final-score-preview {
          margin: 6px 0;
          font-size: 1.05rem;
          color: #1c1d1f;
        }
        .final-score-preview strong { color: #a435f0; font-size: 1.2rem; }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .pending-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .grading-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .item-info {
          flex: 1;
        }

        .item-info h4 {
          margin: 0 0 5px 0;
          color: #1c1d1f;
        }

        .course-name {
          font-size: 0.9rem;
          color: #a435f0;
          margin: 3px 0;
        }

        .question-text {
          font-size: 0.95rem;
          color: #333;
          margin: 5px 0;
        }

        .question-type {
          font-size: 0.85rem;
          color: #666;
          margin-top: 5px;
        }

        .timestamp {
          font-size: 0.8rem;
          color: #999;
          margin-top: 5px;
        }

        .students-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .student-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .student-card h4 {
          margin: 0 0 10px 0;
          color: #1c1d1f;
        }

        .student-card .id {
          font-size: 0.9rem;
          color: #666;
          margin: 5px 0;
        }

        .student-card .email {
          font-size: 0.85rem;
          color: #999;
          margin: 5px 0 15px 0;
          word-break: break-all;
        }

        .stats {
          display: flex;
          gap: 20px;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .stat .value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #a435f0;
        }

        .stat .label {
          font-size: 0.85rem;
          color: #666;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  )
}
