import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ContentViewer from '../components/ContentViewer'
import RichTextEditor from '../components/RichTextEditor'
import api from '../api/axios'

// ============================================================================
// דף ניהול חומר לימוד (AdminContentPage)
// ----------------------------------------------------------------------------
// תפקיד:
//   ניהול פריטי החומר של קורס או של פרק (מנהל). מאפשר להוסיף/לערוך/למחוק פריטים
//   מסוגים שונים: טקסט, טקסט+תמונה (RICH), תמונה, וידאו (קובץ או YouTube),
//   מסמך (PDF/Office) וקישור. כולל תצוגה מקדימה של כל פריט.
//
// מבנה עיקרי / state:
//   • base    — כתובת ה-API: אם יש chapterId — חומר פרק, אחרת חומר מבוא לקורס.
//   • items   — פריטי החומר הקיימים.
//   • editingId + type/title/textContent/file/image — טופס אחד המשמש להוספה ולעריכה.
//
// הקשר במערכת:
//   route: "/admin/courses/:courseId/content" או ".../chapters/:chapterId/content".
//   פונה ל-GET/POST/PUT/DELETE של base. העלאת קבצים נשלחת כ-multipart/form-data.
// ============================================================================

type ContentType = 'TEXT' | 'RICH' | 'IMAGE' | 'VIDEO' | 'PDF' | 'LINK'

interface ContentItem {
  id: number
  content_type: ContentType
  title: string
  content: string
  extra?: string | null
  sort_order: number
}

const TYPE_LABELS: Record<ContentType, string> = {
  TEXT: 'טקסט',
  RICH: 'טקסט + תמונה',
  IMAGE: 'תמונה',
  VIDEO: 'וידאו',
  PDF: 'מסמך (PDF / Word / Excel)',
  LINK: 'קישור',
}

// סוגים שמצריכים העלאת קובץ בודד
const FILE_TYPES: ContentType[] = ['IMAGE', 'VIDEO', 'PDF']

export default function AdminContentPage() {
  const { courseId, chapterId } = useParams()
  const navigate = useNavigate()
  // אם יש chapterId — מנהלים חומר של פרק; אחרת מבוא של הקורס
  const base = chapterId
    ? `/courses/${courseId}/chapters/${chapterId}/content`
    : `/courses/${courseId}/content`

  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  // טופס (משמש גם להוספה וגם לעריכה)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [type, setType] = useState<ContentType>('TEXT')
  const [title, setTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [image, setImage] = useState<File | null>(null) // ל-RICH

  const isFileType = FILE_TYPES.includes(type)
  const isEditing = editingId !== null

  // טוען את פריטי החומר הקיימים (GET base).
  function loadContent() {
    api.get(base)
      .then((res) => setItems(res.data))
      .catch(() => setError('שגיאה בטעינת החומר'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadContent()
  }, [courseId, chapterId])

  // מאפס את הטופס למצב הוספה נקי (כולל ניקוי שדות בחירת הקבצים ב-DOM).
  function resetForm() {
    setEditingId(null)
    setType('TEXT')
    setTitle('')
    setTextContent('')
    setFile(null)
    setImage(null)
    const fi = document.getElementById('file-input') as HTMLInputElement
    if (fi) fi.value = ''
    const ii = document.getElementById('image-input') as HTMLInputElement
    if (ii) ii.value = ''
  }

  // טוען פריט קיים לתוך הטופס לצורך עריכה (וגולל למעלה).
  function startEdit(item: ContentItem) {
    setEditingId(item.id)
    setType(item.content_type)
    setTitle(item.title)
    // לסוגי קובץ אין טקסט; ל-TEXT/LINK/VIDEO(YouTube)/RICH יש
    setTextContent(FILE_TYPES.includes(item.content_type) ? '' : item.content || '')
    setFile(null)
    setImage(null)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // שמירת הטופס (הוספה או עריכה): מריץ ולידציה לפי סוג החומר, ואז שולח לשרת.
  // כשיש קובץ/תמונה — שולח כ-FormData (multipart), אחרת כ-JSON. POST להוספה / PUT לעריכה.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('יש להזין כותרת')
      return
    }

    // ולידציה לפי סוג (בעריכה אפשר להשאיר קובץ קיים)
    if (type === 'RICH') {
      if (!textContent.trim() && !image && !isEditing) {
        setError('יש להזין טקסט או לבחור תמונה')
        return
      }
    } else if (isFileType) {
      if (!file && !isEditing) {
        setError('יש לבחור קובץ להעלאה')
        return
      }
    } else {
      if (!textContent.trim()) {
        setError('יש להזין תוכן')
        return
      }
    }

    setUploading(true)
    try {
      // נשתמש ב-FormData תמיד כשיש קובץ/תמונה, אחרת JSON
      const needsMultipart = (isFileType && file) || (type === 'RICH' && image)

      if (needsMultipart) {
        const fd = new FormData()
        fd.append('content_type', type)
        fd.append('title', title)
        if (type === 'RICH') {
          fd.append('content', textContent)
          if (image) fd.append('image', image)
        } else if (file) {
          fd.append('file', file)
        }
        if (isEditing) {
          await api.put(`${base}/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        } else {
          await api.post(base, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
      } else {
        // ללא קובץ חדש — JSON
        const payload = { content_type: type, title, content: textContent }
        if (isEditing) {
          await api.put(`${base}/${editingId}`, payload)
        } else {
          await api.post(base, payload)
        }
      }

      resetForm()
      loadContent()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בשמירת החומר')
    } finally {
      setUploading(false)
    }
  }

  // מחיקת פריט חומר (DELETE base/:id).
  async function handleDelete(id: number) {
    if (!confirm('למחוק את החומר?')) return
    try {
      await api.delete(`${base}/${id}`)
      if (editingId === id) resetForm()
      loadContent()
    } catch {
      setError('שגיאה במחיקה')
    }
  }

  return (
    <div className="page">
      <Navbar
        subtitle={chapterId ? 'חומר לימוד לפרק' : 'ניהול חומר לימוד'}
        back={
          <button
            className="btn-back"
            onClick={() => navigate(chapterId ? `/admin/courses/${courseId}/chapters` : '/admin')}
          >
            ← {chapterId ? 'חזרה לפרקים' : 'חזרה לניהול'}
          </button>
        }
      />

      <main className="main-content">
        <section className="admin-section">
          <h2>
            {isEditing ? 'עריכת חומר' : chapterId ? 'הוספת חומר לימוד לפרק' : 'הוספת חומר לימוד (מבוא לקורס)'}
          </h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>סוג החומר</label>
              <select
                className="select-input"
                value={type}
                disabled={isEditing}
                onChange={(e) => {
                  setType(e.target.value as ContentType)
                  setFile(null)
                  setImage(null)
                  setTextContent('')
                }}
              >
                {(Object.keys(TYPE_LABELS) as ContentType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
              {isEditing && <p className="question-type-hint">לא ניתן לשנות סוג בעריכה</p>}
            </div>

            <div className="form-group">
              <label>כותרת</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="לדוגמה: מבוא לתדרי רדיו"
                required
              />
            </div>

            {(type === 'TEXT' || type === 'RICH') && (
              <div className="form-group">
                <label>תוכן הטקסט{type === 'RICH' ? ' (יוצג מעל התמונה)' : ''}</label>
                <RichTextEditor
                  value={textContent}
                  onChange={setTextContent}
                  placeholder="כתוב כאן את חומר הלימוד... אפשר להדגיש, לסמן רשימות, ליישר ולשנות גודל."
                />
              </div>
            )}

            {type === 'RICH' && (
              <div className="form-group">
                <label>תמונה {isEditing ? '(השאר ריק כדי לשמור את הקיימת)' : ''}</label>
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
              </div>
            )}

            {type === 'LINK' && (
              <div className="form-group">
                <label>כתובת הקישור (URL)</label>
                <input
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
            )}

            {type === 'VIDEO' && (
              <div className="form-group">
                <label>קישור לסרטון YouTube (או בחר קובץ וידאו למטה)</label>
                <input
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  dir="ltr"
                />
              </div>
            )}

            {isFileType && (
              <div className="form-group">
                <label>
                  {type === 'IMAGE' && 'בחר תמונה'}
                  {type === 'VIDEO' && 'בחר קובץ וידאו (אופציונלי אם הזנת קישור YouTube)'}
                  {type === 'PDF' && 'בחר מסמך (PDF, Word, Excel, PowerPoint)'}
                  {isEditing ? ' (השאר ריק כדי לשמור את הקיים)' : ''}
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept={
                    type === 'IMAGE'
                      ? 'image/*'
                      : type === 'VIDEO'
                      ? 'video/*'
                      : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt'
                  }
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            {error && <p className="error-msg">{error}</p>}
            <div className="admin-chapter-actions">
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'שומר...' : isEditing ? 'שמור שינויים' : 'הוסף חומר'}
              </button>
              {isEditing && (
                <button type="button" className="btn-outline" onClick={resetForm}>ביטול</button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-section">
          <h2>חומר קיים ({items.length})</h2>
          {loading && <p className="loading">טוען...</p>}
          {!loading && items.length === 0 && (
            <p className="empty-state">אין חומר לימוד עדיין</p>
          )}
          <div className="content-list">
            {items.map((item) => (
              <div key={item.id} className="admin-content-row">
                <div className="admin-content-badge">{TYPE_LABELS[item.content_type]}</div>
                <div className="admin-content-preview">
                  <ContentViewer item={item} />
                </div>
                <div className="admin-content-actions">
                  <button className="btn-outline" onClick={() => startEdit(item)}>ערוך</button>
                  <button className="btn-danger" onClick={() => handleDelete(item.id)}>מחק</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
