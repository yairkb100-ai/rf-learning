import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RichTextEditor from '../components/RichTextEditor'
import api from '../api/axios'

interface Chapter {
  id: number
  course_id: number
  title: string
  description: string | null
  order_number: number
}

// הופך HTML לטקסט פשוט לתצוגה מקדימה ברשימת הניהול
function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

export default function AdminChaptersPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [allCourses, setAllCourses] = useState<{ id: number; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // טופס פרק חדש
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // עריכת פרק קיים
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  function loadChapters() {
    api.get(`/courses/${courseId}/chapters`)
      .then((res) => setChapters(res.data))
      .catch(() => setError('שגיאה בטעינת הפרקים'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadChapters()
    // רשימת כל הקורסים — ליעד העברה/שכפול (מנהל מקבל את כולם)
    api.get('/courses').then((res) => setAllCourses(res.data)).catch(() => {})
  }, [courseId])

  // בוחר קורס יעד דרך prompt ומחזיר id (או null אם בוטל)
  function pickTargetCourse(promptText: string): number | null {
    const list = allCourses.map((c) => `${c.id}: ${c.title}`).join('\n')
    const choice = prompt(`${promptText}\n\nהקלד מספר קורס יעד:\n${list}`, '')
    if (choice === null || !choice.trim()) return null
    return Number(choice.trim())
  }

  async function moveToCourse(ch: Chapter) {
    const target = pickTargetCourse(`העברת הפרק "${ch.title}" לקורס אחר.`)
    if (!target || target === Number(courseId)) return
    try {
      await api.put(`/admin/chapters/${ch.id}/move`, { target_course_id: target })
      loadChapters()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בהעברת הפרק')
    }
  }

  async function duplicateToCourse(ch: Chapter) {
    const target = pickTargetCourse(
      `שכפול הפרק "${ch.title}".\nהשאר מספר הקורס הנוכחי (${courseId}) לשכפול באותו קורס, או קורס אחר.`
    )
    if (target === null) return
    try {
      await api.post(`/admin/chapters/${ch.id}/duplicate`, { target_course_id: target })
      // אם שוכפל לאותו קורס — נרענן; אחרת רק הודעה
      if (target === Number(courseId)) loadChapters()
      else alert('הפרק שוכפל לקורס היעד')
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בשכפול הפרק')
    }
  }

  async function handleAddChapter(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) {
      setError('יש להזין שם פרק')
      return
    }
    try {
      await api.post(`/courses/${courseId}/chapters`, {
        title,
        description: description || null,
      })
      setTitle('')
      setDescription('')
      loadChapters()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בהוספת פרק')
    }
  }

  function startEdit(ch: Chapter) {
    setEditingId(ch.id)
    setEditTitle(ch.title)
    setEditDescription(ch.description || '')
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  async function handleSaveEdit(id: number) {
    if (!editTitle.trim()) {
      setError('יש להזין שם פרק')
      return
    }
    try {
      await api.put(`/courses/${courseId}/chapters/${id}`, {
        title: editTitle,
        description: editDescription || null,
      })
      cancelEdit()
      loadChapters()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בעדכון פרק')
    }
  }

  async function handleDelete(id: number, chTitle: string) {
    if (!confirm(`למחוק את הפרק "${chTitle}"?`)) return
    try {
      await api.delete(`/courses/${courseId}/chapters/${id}`)
      loadChapters()
    } catch {
      setError('שגיאה במחיקת פרק')
    }
  }

  async function moveChapter(index: number, direction: -1 | 1) {
    const target = chapters[index + direction]
    const current = chapters[index]
    if (!target) return
    // החלפת מספרי הסדר בין שני הפרקים
    try {
      await Promise.all([
        api.put(`/courses/${courseId}/chapters/${current.id}`, { order_number: target.order_number }),
        api.put(`/courses/${courseId}/chapters/${target.id}`, { order_number: current.order_number }),
      ])
      loadChapters()
    } catch {
      setError('שגיאה בשינוי סדר הפרקים')
    }
  }

  return (
    <div className="page">
      <Navbar
        subtitle="ניהול פרקים"
        back={<button className="btn-back" onClick={() => navigate('/admin')}>← חזרה לניהול</button>}
      />

      <main className="main-content">
        <section className="admin-section">
          <h2>הוספת פרק חדש</h2>
          <form onSubmit={handleAddChapter} className="admin-form">
            <div className="form-group">
              <label>שם הפרק</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="לדוגמה: מבוא לגלי רדיו"
                required
              />
            </div>
            <div className="form-group">
              <label>תיאור (אופציונלי)</label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="תיאור הפרק... אפשר להדגיש, לסמן רשימות, ליישר ולשנות גודל."
              />
            </div>
            {error && !editingId && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary">הוסף פרק</button>
          </form>
        </section>

        <section className="admin-section">
          <h2>פרקים קיימים ({chapters.length})</h2>
          {loading && <p className="loading">טוען...</p>}
          {!loading && chapters.length === 0 && (
            <p className="empty-state">אין פרקים בקורס זה עדיין</p>
          )}
          <div className="admin-chapters-list">
            {chapters.map((ch, idx) => (
              <div key={ch.id} className="admin-chapter-item">
                {editingId === ch.id ? (
                  <div className="admin-chapter-edit">
                    <div className="form-group">
                      <label>שם הפרק</label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>תיאור</label>
                      <RichTextEditor
                        value={editDescription}
                        onChange={setEditDescription}
                      />
                    </div>
                    {error && <p className="error-msg">{error}</p>}
                    <div className="admin-chapter-actions">
                      <button className="btn-primary" onClick={() => handleSaveEdit(ch.id)}>שמור</button>
                      <button className="btn-outline" onClick={cancelEdit}>ביטול</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="admin-chapter-info">
                      <h3>{idx + 1}. {ch.title}</h3>
                      {ch.description && <p>{stripHtml(ch.description)}</p>}
                    </div>
                    <div className="admin-chapter-actions">
                      <button
                        className="btn-outline"
                        onClick={() => navigate(`/admin/courses/${courseId}/chapters/${ch.id}/content`)}
                      >חומר הפרק</button>
                      <button
                        className="btn-outline"
                        onClick={() => navigate(`/admin/courses/${courseId}/chapters/${ch.id}/questions`)}
                      >שאלות</button>
                      <button
                        className="btn-outline"
                        onClick={() => moveChapter(idx, -1)}
                        disabled={idx === 0}
                        title="העבר למעלה"
                      >↑</button>
                      <button
                        className="btn-outline"
                        onClick={() => moveChapter(idx, 1)}
                        disabled={idx === chapters.length - 1}
                        title="העבר למטה"
                      >↓</button>
                      <button className="btn-outline" onClick={() => startEdit(ch)}>ערוך</button>
                      <button className="btn-secondary" onClick={() => moveToCourse(ch)} title="העבר לקורס אחר">העבר לקורס</button>
                      <button className="btn-secondary" onClick={() => duplicateToCourse(ch)} title="שכפל את הפרק">שכפל</button>
                      <button className="btn-danger" onClick={() => handleDelete(ch.id, ch.title)}>מחק</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
