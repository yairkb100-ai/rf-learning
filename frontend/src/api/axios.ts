import axios from 'axios'

// ============================================================================
// מופע Axios מרכזי לתקשורת עם השרת (API Client)
// ----------------------------------------------------------------------------
// תפקיד:
//   יוצר מופע axios אחד לכל הבקשות לשרת. מוסיף אוטומטית טוקן הזדהות לכל בקשה,
//   ומטפל בחידוש טוקן (refresh) כאשר הטוקן פג תוקף (שגיאת 401).
//
// הקשר במערכת:
//   • baseURL '/api' — כל הבקשות מנותבות דרך פרוקסי אל השרת (backend).
//   • משתמש ב-localStorage לשמירת accessToken ו-refreshToken.
//   • כל קבצי ה-api/pages מייבאים את המופע הזה במקום את axios הגולמי.
// ============================================================================

const api = axios.create({
  baseURL: '/api',
})

// Interceptor לבקשות: לפני כל בקשה יוצאת, מצרף את טוקן ההזדהות (אם קיים)
// לכותרת Authorization בפורמט Bearer.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor לתגובות: מטפל אוטומטית בטוקן שפג תוקף.
// אם התקבלה שגיאת 401 (לא מורשה) ועוד לא ניסינו לחדש טוקן לבקשה הזו —
// שולח בקשת refresh, שומר טוקנים חדשים ומריץ מחדש את הבקשה המקורית.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true // מסמן שכבר ניסינו לחדש — למניעת לולאה אינסופית
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          // בקשת חידוש טוקן מול endpoint: POST /api/auth/refresh
          const res = await axios.post('/api/auth/refresh', { refreshToken })
          localStorage.setItem('accessToken', res.data.accessToken)
          localStorage.setItem('refreshToken', res.data.refreshToken)
          original.headers.Authorization = `Bearer ${res.data.accessToken}`
          return api(original) // הרצה חוזרת של הבקשה המקורית עם הטוקן החדש
        } catch {
          // החידוש נכשל — מנקים את הזיכרון ומפנים למסך ההתחברות
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        // אין refreshToken כלל — מפנים למסך ההתחברות
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
