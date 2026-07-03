import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

type QuestionType = 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'FREE_TEXT' | 'FILE_UPLOAD'

interface Option {
  id?: number
  answer_text: string
  is_correct: boolean
}

interface Question {
  id: number
  question_type: QuestionType
  question_text: string
  hint: string | null
  explanation: string | null
  video_url: string | null
  model_answer: string | null
  options: Option[]
}

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'אמריקאית (תשובה אחת נכונה)',
  MULTIPLE_SELECT: 'בחירה מרובה (כמה נכונות)',
  FREE_TEXT: 'שאלה פתוחה (בדיקה ידנית)',
  FILE_UPLOAD: 'העלאת קובץ (סטודנט מעלה קובץ)',
}

function emptyOptions(): Option[] {
  return [
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false },
  ]
}

export default function AdminQuestionsPage() {
  const { courseId, chapterId } = useParams()
  const navigate = useNavigate()
  const [chapterTitle, setChapterTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // טופס שאלה חדשה
  const [qType, setQType] = useState<QuestionType>('MULTIPLE_CHOICE')
  const [questionText, setQuestionText] = useState('')
  const [hint, setHint] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [modelAnswer, setModelAnswer] = useState('')
  const [options, setOptions] = useState<Option[]>(emptyOptions())

  const base = `/courses/${courseId}/chapters/${chapterId}`
  const isChoice = qType === 'MULTIPLE_CHOICE' || qType === 'MULTIPLE_SELECT'

  function loadQuestions() {
    api.get(`${base}/questions`)
      .then((res) => setQuestions(res.data))
      .catch(() => setError('שגיאה בטעינת השאלות'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.get(`${base}`).then((res) => setChapterTitle(res.data.title)).catch(() => {})
    loadQuestions()
  }, [courseId, chapterId])

  function updateOption(index: number, field: keyof Option, value: string | boolean) {
    const newOptions = [...options]
    // באמריקאית — סימון נכונה אחת מבטל את האחרות
    if (field === 'is_correct' && value === true && qType === 'MULTIPLE_CHOICE') {
      newOptions.forEach((o, i) => { o.is_correct = i === index })
    } else {
      newOptions[index] = { ...newOptions[index], [field]: value }
    }
    setOptions(newOptions)
  }

  function addOptionField() {
    setOptions([...options, { answer_text: '', is_correct: false }])
  }

  function removeOptionField(index: number) {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }

  function resetForm() {
    setQType('MULTIPLE_CHOICE')
    setQuestionText('')
    setHint('')
    setVideoUrl('')
    setModelAnswer('')
    setOptions(emptyOptions())
  }

  async function handleAddQuestion(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!questionText.trim()) {
      setError('יש להזין נוסח שאלה')
      return
    }

    const payload: any = {
      question_type: qType,
      question_text: questionText,
      hint: hint || null,
      video_url: videoUrl || null,
    }

    if (isChoice) {
      const filledOptions = options.filter((o) => o.answer_text.trim())
      if (filledOptions.length < 2) {
        setError('יש להזין לפחות 2 תשובות')
        return
      }
      const correct = filledOptions.filter((o) => o.is_correct)
      if (correct.length === 0) {
        setError('יש לסמן לפחות תשובה נכונה אחת')
        return
      }
      if (qType === 'MULTIPLE_CHOICE' && correct.length !== 1) {
        setError('בשאלה אמריקאית יש לסמן בדיוק תשובה נכונה אחת')
        return
      }
      payload.options = filledOptions
    } else {
      // שאלה פתוחה — תשובת מודל אופציונלית (לעזרת המנהל בבדיקה)
      payload.model_answer = modelAnswer || null
    }

    try {
      await api.post(`${base}/questions`, payload)
      resetForm()
      loadQuestions()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בהוספת שאלה')
    }
  }

  async function handleDeleteQuestion(id: number) {
    if (!confirm('למחוק את השאלה?')) return
    try {
      await api.delete(`${base}/questions/${id}`)
      loadQuestions()
    } catch {
      setError('שגיאה במחיקת שאלה')
    }
  }

  return (
    <div className="page">
      <Navbar
        subtitle={chapterTitle ? `שאלות: ${chapterTitle}` : 'ניהול שאלות'}
        back={<button className="btn-back" onClick={() => navigate(`/admin/courses/${courseId}/chapters`)}>← חזרה לפרקים</button>}
      />

      <main className="main-content">
        <section className="admin-section">
          <h2>הוספת שאלה חדשה</h2>
          <form onSubmit={handleAddQuestion} className="admin-form">
            <div className="form-group">
              <label>סוג השאלה</label>
              <select
                className="select-input"
                value={qType}
                onChange={(e) => {
                  const t = e.target.value as QuestionType
                  setQType(t)
                  // איפוס סימוני נכונה כשעוברים בין סוגים
                  setOptions(emptyOptions())
                }}
              >
                {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>נוסח השאלה</label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="לדוגמה: מהו תחום התדרים של VHF?"
                rows={2}
                required
              />
            </div>

            <div className="form-group">
              <label>רמז (אופציונלי)</label>
              <input
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="רמז שיעזור לתלמיד"
              />
            </div>

            <div className="form-group">
              <label>קישור וידאו לשאלה (אופציונלי — YouTube)</label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                dir="ltr"
              />
            </div>

            {isChoice && (
              <>
                <label className="options-title">
                  תשובות (סמן את {qType === 'MULTIPLE_CHOICE' ? 'התשובה הנכונה' : 'הנכונות'}):
                </label>
                {options.map((opt, idx) => (
                  <div key={idx} className="option-edit-row">
                    <input
                      type={qType === 'MULTIPLE_CHOICE' ? 'radio' : 'checkbox'}
                      name="correct-option"
                      checked={opt.is_correct}
                      onChange={(e) => updateOption(idx, 'is_correct', e.target.checked)}
                      title="תשובה נכונה"
                    />
                    <input
                      className="option-text-input"
                      value={opt.answer_text}
                      onChange={(e) => updateOption(idx, 'answer_text', e.target.value)}
                      placeholder={`תשובה ${idx + 1}`}
                    />
                    {options.length > 2 && (
                      <button type="button" className="btn-remove" onClick={() => removeOptionField(idx)}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-outline btn-add-option" onClick={addOptionField}>
                  + הוסף תשובה
                </button>
              </>
            )}

            {qType === 'FREE_TEXT' && (
              <div className="form-group">
                <label>תשובת מודל (אופציונלי — תעזור לך בבדיקה)</label>
                <textarea
                  value={modelAnswer}
                  onChange={(e) => setModelAnswer(e.target.value)}
                  placeholder="התשובה הרצויה / נקודות עיקריות לבדיקה"
                  rows={3}
                />
              </div>
            )}

            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary">הוסף שאלה</button>
          </form>
        </section>

        <section className="admin-section">
          <h2>שאלות קיימות ({questions.length})</h2>
          {loading && <p className="loading">טוען...</p>}
          {!loading && questions.length === 0 && (
            <p className="empty-state">אין שאלות בפרק זה עדיין</p>
          )}
          <div className="admin-questions-list">
            {questions.map((q, idx) => (
              <div key={q.id} className="admin-question-item">
                <div className="admin-question-header">
                  <h3>
                    {idx + 1}. {q.question_text}
                    <span className="question-type-badge">{TYPE_LABELS[q.question_type]}</span>
                  </h3>
                  <button className="btn-danger" onClick={() => handleDeleteQuestion(q.id)}>
                    מחק
                  </button>
                </div>
                {q.question_type === 'FREE_TEXT' ? (
                  q.model_answer && <p className="model-answer">תשובת מודל: {q.model_answer}</p>
                ) : (
                  <ul className="admin-options-view">
                    {q.options.map((opt) => (
                      <li key={opt.id} className={opt.is_correct ? 'correct-opt' : ''}>
                        {opt.is_correct ? '✓ ' : ''}{opt.answer_text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
