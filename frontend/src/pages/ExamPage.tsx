import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

type QuestionType = 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'FREE_TEXT' | 'FILE_UPLOAD'

interface Option {
  id: number
  answer_text: string
}

interface Question {
  id: number
  question_type: QuestionType
  question_text: string
  hint: string | null
  video_url: string | null
  options: Option[]
}

interface ExamResult {
  score: number
  total: number
  passed: boolean
  pending_review: boolean
  message: string
}

// ============================================================================
// דף מבחן (ExamPage)
// ----------------------------------------------------------------------------
// תפקיד:
//   מציג את שאלות מבחן הפרק ומאפשר לתלמיד לענות ולהגיש. תומך בארבעה סוגי שאלות:
//   אמריקאית (בחירה יחידה), בחירה מרובה, שאלה פתוחה (טקסט), והעלאת קובץ.
//   לאחר הגשה מציג מסך תוצאה (עבר/נכשל/ממתין לבדיקה) עם אפשרות לנסות שוב.
//
// מבנה עיקרי / state:
//   • questions      — שאלות המבחן.
//   • selected       — לכל שאלה: מזהי האפשרויות שנבחרו (אמריקאית/בחירה מרובה).
//   • freeText       — תשובות טקסט חופשי לפי מזהה שאלה.
//   • uploadedFiles  — קבצים שהועלו לפי מזהה שאלה.
//   • result         — תוצאת המבחן לאחר הגשה (או null לפני הגשה).
//
// הקשר במערכת:
//   route: "/courses/:courseId/chapters/:chapterId/exam".
//   פונה ל-GET .../exam לטעינת השאלות ו-POST .../exam/submit להגשה.
// ============================================================================

// embed ל-YouTube אם רלוונטי
function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

export default function ExamPage() {
  const { courseId, chapterId } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  // לכל שאלה: מערך מזהי אפשרויות שנבחרו (אמריקאית/בחירה מרובה) או טקסט (פתוחה) או קובץ (עלייה)
  const [selected, setSelected] = useState<Record<number, number[]>>({})
  const [freeText, setFreeText] = useState<Record<number, string>>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, File>>({})
  const [result, setResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const base = `/courses/${courseId}/chapters/${chapterId}`

  // בטעינה: טוען את שאלות המבחן מהשרת (GET .../exam).
  useEffect(() => {
    api.get(`${base}/exam`)
      .then((res) => setQuestions(res.data))
      .catch((err) => setError(err.response?.data?.error || 'שגיאה בטעינת המבחן'))
      .finally(() => setLoading(false))
  }, [courseId, chapterId])

  // אמריקאית — בחירה יחידה
  function selectSingle(qId: number, optId: number) {
    setSelected({ ...selected, [qId]: [optId] })
  }

  // בחירה מרובה — toggle
  function toggleMulti(qId: number, optId: number) {
    const cur = selected[qId] || []
    const next = cur.includes(optId) ? cur.filter((id) => id !== optId) : [...cur, optId]
    setSelected({ ...selected, [qId]: next })
  }

  // עדכון תשובת טקסט חופשי לשאלה פתוחה.
  function setText(qId: number, value: string) {
    setFreeText({ ...freeText, [qId]: value })
  }

  // בודק אם ניתנה תשובה לשאלה (לפי סוגה) — משמש לספירת השאלות שנענו ולחסימת הגשה חלקית.
  function isAnswered(q: Question): boolean {
    if (q.question_type === 'FREE_TEXT') return !!(freeText[q.id] && freeText[q.id].trim())
    if (q.question_type === 'FILE_UPLOAD') return !!(uploadedFiles[q.id])
    return (selected[q.id] || []).length > 0
  }

  const answeredCount = questions.filter(isAnswered).length

  // הגשת המבחן: מוודא שכל השאלות נענו, בונה payload לפי סוג כל שאלה,
  // שולח ל-POST .../exam/submit ושומר את התוצאה שהתקבלה.
  async function handleSubmit() {
    if (answeredCount < questions.length) {
      alert('יש לענות על כל השאלות לפני הגשה')
      return
    }
    setSubmitting(true)
    try {
      // בונה מערך תשובות: לכל שאלה נבנה שדה מתאים לסוגה (טקסט/קובץ/אפשרויות שנבחרו)
      const payload = questions.map((q) => {
        const ans: any = {
          question_id: q.id,
        }

        if (q.question_type === 'FREE_TEXT') {
          ans.free_text = freeText[q.id] || ''
        } else if (q.question_type === 'FILE_UPLOAD') {
          const file = uploadedFiles[q.id]
          if (file) {
            ans.file_path = file.name
            ans.file_name = file.name
          }
        } else {
          ans.selected_option_ids = selected[q.id] || []
        }

        return ans
      })
      const res = await api.post(`${base}/exam/submit`, { answers: payload })
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בהגשת המבחן')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">טוען מבחן...</div>
  if (error) return (
    <div className="page">
      <div className="main-content">
        <p className="error-msg">{error}</p>
        <button className="btn-outline" onClick={() => navigate(base)}>
          חזרה לפרק
        </button>
      </div>
    </div>
  )

  // לאחר הגשה: מציג מסך תוצאה במקום השאלות (אייקון וסגנון לפי המצב: ממתין/עבר/נכשל).
  if (result) {
    const icon = result.pending_review ? '⏳' : result.passed ? '🎉' : '❌'
    const cls = result.pending_review ? 'pending' : result.passed ? 'passed' : 'failed'
    return (
      <div className="page">
        <div className="main-content">
          <div className={`exam-result ${cls}`}>
            <div className="result-icon">{icon}</div>
            <h2>{result.message}</h2>
            <div className="score-display">
              <span className="score-number">{result.score}%</span>
              {result.pending_review && (
                <span className="score-detail">ציון זמני — יתעדכן אחרי בדיקת המנהל</span>
              )}
            </div>
            <div className="result-actions">
              <button className="btn-primary" onClick={() => navigate(base)}>
                חזרה לפרק
              </button>
              {!result.passed && !result.pending_review && (
                <button className="btn-outline" onClick={() => { setResult(null); setSelected({}); setFreeText({}) }}>
                  נסה שוב
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar
        subtitle="מבחן הפרק"
        back={<button className="btn-back" onClick={() => navigate(base)}>← חזרה</button>}
        left={<span>{answeredCount}/{questions.length} נענו</span>}
      />
      <main className="main-content">
        {/* רשימת השאלות — לכל שאלה מוצג ממשק מענה שונה לפי סוגה (טקסט/קובץ/אמריקאית/בחירה מרובה) */}
        <div className="questions-list">
          {questions.map((q, idx) => (
            <div key={q.id} className="question-card">
              <h3>{idx + 1}. {q.question_text}</h3>
              {q.question_type === 'MULTIPLE_SELECT' && (
                <p className="question-type-hint">(ניתן לבחור יותר מתשובה אחת)</p>
              )}
              {q.hint && <p className="hint">💡 {q.hint}</p>}

              {q.video_url && (() => {
                const yt = youtubeEmbed(q.video_url)
                return (
                  <div className="content-video-wrap">
                    {yt ? (
                      <iframe src={yt} title={`וידאו לשאלה ${idx + 1}`} allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    ) : (
                      <video controls className="content-video"><source src={q.video_url} /></video>
                    )}
                  </div>
                )
              })()}

              {q.question_type === 'FREE_TEXT' ? (
                <textarea
                  className="free-text-answer"
                  value={freeText[q.id] || ''}
                  onChange={(e) => setText(q.id, e.target.value)}
                  placeholder="כתוב את תשובתך כאן..."
                  rows={4}
                />
              ) : q.question_type === 'FILE_UPLOAD' ? (
                <div className="file-upload-box">
                  <input
                    type="file"
                    id={`file-${q.id}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setUploadedFiles({ ...uploadedFiles, [q.id]: file })
                    }}
                    className="file-input"
                  />
                  <label htmlFor={`file-${q.id}`} className="file-label">
                    {uploadedFiles[q.id] ? `✅ ${uploadedFiles[q.id].name}` : '📎 בחר קובץ להעלאה'}
                  </label>
                </div>
              ) : (
                <div className="options-list">
                  {q.options.map((opt) => {
                    const checked = (selected[q.id] || []).includes(opt.id)
                    const isMulti = q.question_type === 'MULTIPLE_SELECT'
                    return (
                      <label key={opt.id} className={`option-label ${checked ? 'selected' : ''}`}>
                        <input
                          type={isMulti ? 'checkbox' : 'radio'}
                          name={`q-${q.id}`}
                          checked={checked}
                          onChange={() => isMulti ? toggleMulti(q.id, opt.id) : selectSingle(q.id, opt.id)}
                        />
                        {opt.answer_text}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="exam-footer">
          <button className="btn-primary btn-large" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'שולח...' : 'הגש מבחן'}
          </button>
        </div>
      </main>
    </div>
  )
}
