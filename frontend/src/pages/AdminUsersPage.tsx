import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

// ============================================================================
// דף ניהול משתמשים (AdminUsersPage)
// ----------------------------------------------------------------------------
// תפקיד:
//   ניהול משתמשי המערכת (מנהל). מאפשר יצירת תלמיד/מנהל חדש (עם ולידציית שם
//   משתמש וסיסמה), איפוס סיסמה ומחיקה, וכן מעקב אחר התקדמות התלמידים בטבלה.
//   מנהל-על (super admin) יכול גם לשייך תלמיד למנהל מסוים.
//
// מבנה עיקרי / state:
//   • users (מפוצל ל-admins/students), specs, progress — נתונים מהשרת.
//   • טופס יצירה: role, fullName, idNum, password, title, specId, assignedAdminId.
//   • isSuperAdmin — האם המשתמש הנוכחי מנהל-על (מציג שיוך למנהל).
//
// הקשר במערכת:
//   route: "/admin/users". פונה ל-GET/POST/PUT/DELETE של /admin/users,
//   ל-/admin/students/progress ול-/specializations.
// ============================================================================

interface User {
  id: number
  full_name: string
  username: string
  role: 'STUDENT' | 'ADMIN'
  title: string | null
  specialization_id: number | null
  specialization_name: string | null
  created_by_name: string | null
}
interface Spec { id: number; name: string }
interface ProgressRow {
  id: number
  full_name: string
  username: string
  specialization_name: string | null
  chapters_completed: number
  exam_attempts: number
  avg_score: number | null
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.is_super_admin === true
  const [users, setUsers] = useState<User[]>([])
  const [specs, setSpecs] = useState<Spec[]>([])
  const [progress, setProgress] = useState<ProgressRow[]>([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  // טופס יצירת משתמש
  const [role, setRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT')
  const [fullName, setFullName] = useState('')
  const [idNum, setIdNum] = useState('')      // 9 ספרות; OA יתווסף
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [specId, setSpecId] = useState('')
  const [assignedAdminId, setAssignedAdminId] = useState('')  // רק למנהל כללי

  // טוען את כל הנתונים לדף: משתמשים, מגמות ונתוני התקדמות תלמידים.
  function load() {
    api.get('/admin/users').then((r) => setUsers(r.data)).catch(() => setError('שגיאה בטעינת משתמשים'))
    api.get('/specializations').then((r) => setSpecs(r.data)).catch(() => {})
    api.get('/admin/students/progress').then((r) => setProgress(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  // יצירת משתמש חדש: מריץ ולידציה לשם המשתמש (תבנית OA+9 ספרות) ולסיסמה
  // (אות גדולה+קטנה+מספר, 6–8 תווים), ואז שולח ל-POST /admin/users.
  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(''); setOk('')
    if (!/^OA\d{9}$/.test(idNum)) { setError('שם המשתמש חייב להיות בתבנית OA ואחריו 9 ספרות (לדוגמה OA123456789)'); return }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,8}$/.test(password)) {
      setError('הסיסמה חייבת להכיל אות גדולה, אות קטנה ומספר, באורך 6 עד 8 תווים'); return
    }
    if (role === 'ADMIN' && !title.trim()) { setError('חובה להזין תפקיד (טייטל) למנהל'); return }
    try {
      await api.post('/admin/users', {
        full_name: fullName,
        username: idNum,
        password,
        role,
        title: role === 'ADMIN' ? title : undefined,
        specialization_id: role === 'STUDENT' && specId ? Number(specId) : undefined,
        assigned_admin_id: role === 'STUDENT' && isSuperAdmin && assignedAdminId ? Number(assignedAdminId) : undefined,
      })
      setOk(`נוצר בהצלחה: ${idNum}`)
      setFullName(''); setIdNum(''); setPassword(''); setTitle(''); setSpecId(''); setAssignedAdminId('')
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה ביצירת המשתמש')
    }
  }

  // איפוס סיסמה למשתמש (PUT /admin/users/:id/reset-password) עם ולידציית סיסמה.
  async function handleResetPassword(u: User) {
    setError(''); setOk('')
    const pw = prompt(`איפוס סיסמה ל${u.full_name} (${u.username}).\nסיסמה חדשה (אות גדולה+קטנה+מספר, 6–8 תווים):`)
    if (pw === null) return
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,8}$/.test(pw)) {
      setError('הסיסמה חייבת להכיל אות גדולה, אות קטנה ומספר, באורך 6 עד 8 תווים'); return
    }
    try {
      await api.put(`/admin/users/${u.id}/reset-password`, { password: pw })
      setOk(`הסיסמה של ${u.username} אופסה בהצלחה`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה באיפוס הסיסמה')
    }
  }

  // מחיקת משתמש (DELETE /admin/users/:id).
  async function handleDelete(u: User) {
    if (!confirm(`למחוק את ${u.full_name} (${u.username})?`)) return
    try { await api.delete(`/admin/users/${u.id}`); load() }
    catch (err: any) { setError(err.response?.data?.error || 'שגיאה במחיקה') }
  }

  // הפרדת המשתמשים למנהלים ולתלמידים לצורך תצוגה בשתי רשימות נפרדות.
  const admins = users.filter((u) => u.role === 'ADMIN')
  const students = users.filter((u) => u.role === 'STUDENT')

  return (
    <div className="page">
      <Navbar subtitle="ניהול משתמשים"
        back={<button className="btn-back" onClick={() => navigate('/admin')}>← חזרה לניהול</button>} />

      <main className="main-content">
        {/* יצירת משתמש */}
        <section className="admin-section">
          <h2>יצירת משתמש חדש</h2>
          <form onSubmit={handleCreate} className="admin-form">
            <div className="form-group">
              <label>סוג משתמש</label>
              <select value={role} onChange={(e) => setRole(e.target.value as 'STUDENT' | 'ADMIN')}>
                <option value="STUDENT">תלמיד</option>
                <option value="ADMIN">מנהל</option>
              </select>
            </div>
            <div className="form-group">
              <label>שם מלא</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>שם משתמש — OA ואחריו 9 ספרות (לדוגמה OA123456789)</label>
              <input value={idNum} onChange={(e) => setIdNum(e.target.value.toUpperCase())} dir="ltr" maxLength={11} required />
            </div>
            <div className="form-group">
              <label>סיסמה (אות גדולה+קטנה+מספר, 6–8 תווים)</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" maxLength={8} required />
            </div>
            {role === 'ADMIN' && (
              <div className="form-group">
                <label>תפקיד / טייטל (חובה למנהל)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
            )}
            {role === 'STUDENT' && (
              <div className="form-group">
                <label>מגמה</label>
                <select value={specId} onChange={(e) => setSpecId(e.target.value)}>
                  <option value="">ללא מגמה (כלליים בלבד)</option>
                  {specs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {role === 'STUDENT' && isSuperAdmin && (
              <div className="form-group">
                <label>שיוך למנהל</label>
                <select value={assignedAdminId} onChange={(e) => setAssignedAdminId(e.target.value)}>
                  <option value="">ללא שיוך</option>
                  {admins.map((a) => <option key={a.id} value={a.id}>{a.full_name} ({a.username})</option>)}
                </select>
              </div>
            )}
            {error && <p className="error-msg">{error}</p>}
            {ok && <p className="success-msg">{ok}</p>}
            <button type="submit" className="btn-primary">צור משתמש</button>
          </form>
        </section>

        {/* מעקב התקדמות תלמידים */}
        <section className="admin-section">
          <h2>מעקב התקדמות תלמידים</h2>
          {progress.length === 0 ? <p className="empty-state">אין נתוני תלמידים</p> : (
            <table className="data-table">
              <thead>
                <tr><th>תלמיד</th><th>שם משתמש</th><th>מגמה</th><th>פרקים שהושלמו</th><th>ניסיונות מבחן</th><th>ציון ממוצע</th><th></th></tr>
              </thead>
              <tbody>
                {progress.map((p) => (
                  <tr key={p.id}>
                    <td>{p.full_name}</td>
                    <td dir="ltr">{p.username}</td>
                    <td>{p.specialization_name || '—'}</td>
                    <td>{p.chapters_completed}</td>
                    <td>{p.exam_attempts}</td>
                    <td>{p.avg_score != null ? `${p.avg_score}%` : '—'}</td>
                    <td><button className="btn-outline" onClick={() => navigate(`/admin/students/${p.id}`)}>פירוט</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* רשימת מנהלים */}
        <section className="admin-section">
          <h2>מנהלים ({admins.length})</h2>
          <div className="admin-courses-list">
            {admins.map((u) => (
              <div key={u.id} className="admin-course-item">
                <div className="admin-course-info">
                  <h3>{u.full_name} {u.title && <span className="user-title-badge">{u.title}</span>}</h3>
                  <p dir="ltr">{u.username}</p>
                  {u.created_by_name && <span className="spec-count">נוצר ע"י {u.created_by_name}</span>}
                </div>
                <div className="admin-course-actions">
                  <button className="btn-outline" onClick={() => handleResetPassword(u)}>🔑 אפס סיסמה</button>
                  <button className="btn-danger" onClick={() => handleDelete(u)}>מחק</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* רשימת תלמידים */}
        <section className="admin-section">
          <h2>תלמידים ({students.length})</h2>
          <div className="admin-courses-list">
            {students.map((u) => (
              <div key={u.id} className="admin-course-item">
                <div className="admin-course-info">
                  <h3>{u.full_name}</h3>
                  <p dir="ltr">{u.username}</p>
                  <span className="spec-count">{u.specialization_name || 'ללא מגמה'}</span>
                </div>
                <div className="admin-course-actions">
                  <button className="btn-outline" onClick={() => navigate(`/admin/students/${u.id}`)}>התקדמות</button>
                  <button className="btn-outline" onClick={() => handleResetPassword(u)}>🔑 אפס סיסמה</button>
                  <button className="btn-danger" onClick={() => handleDelete(u)}>מחק</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
