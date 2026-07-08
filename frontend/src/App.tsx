import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import Footer from './components/Footer'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import SpecializationPage from './pages/SpecializationPage'
import CoursePage from './pages/CoursePage'
import ChapterPage from './pages/ChapterPage'
import ExamPage from './pages/ExamPage'
import AdminPage from './pages/AdminPage'
import AdminQuestionsPage from './pages/AdminQuestionsPage'
import AdminContentPage from './pages/AdminContentPage'
import AdminChaptersPage from './pages/AdminChaptersPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminGradingPage from './pages/AdminGradingPage'
import StudentProgressPage from './pages/StudentProgressPage'
import StudentMyProgressPage from './pages/StudentMyProgressPage'
import './App.css'

// ============================================================================
// רכיב השורש של האפליקציה (App Root)
// ----------------------------------------------------------------------------
// תפקיד:
//   מגדיר את שלד האפליקציה: ספקי ה-Context (עיצוב והזדהות), הניתוב (Routing)
//   בין כל הדפים, וה-Footer הקבוע בתחתית.
//
// מבנה עיקרי:
//   • ThemeProvider — מספק מצב עיצוב (בהיר/כהה) לכל האפליקציה.
//   • AuthProvider  — מספק מצב הזדהות (משתמש מחובר, כניסה/יציאה).
//   • BrowserRouter + Routes — טבלת הניתוב בין כל הדפים.
//   • PrivateRoute — עוטף דפים שדורשים התחברות; מפנה ל-/login אם המשתמש אינו מחובר.
//
// הקשר במערכת:
//   הדפים מחולקים לשניים: דפי לומד (בית, התמחות, קורס, פרק, מבחן)
//   ודפי ניהול (admin) — לוח בקרה, ניהול משתמשים, בדיקת מבחנים, ניהול תוכן ושאלות.
//   כל נתיב לא מוכר (*) מנותב חזרה לדף הבית.
// ============================================================================

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* טבלת הניתוב: כל Route ממפה כתובת URL לדף. רוב הדפים עטופים ב-PrivateRoute (דורש התחברות) */}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/my-progress" element={<PrivateRoute><StudentMyProgressPage /></PrivateRoute>} />
            <Route path="/specializations/:specializationId" element={<PrivateRoute><SpecializationPage /></PrivateRoute>} />
            <Route path="/courses/:courseId" element={<PrivateRoute><CoursePage /></PrivateRoute>} />
            <Route path="/courses/:courseId/chapters/:chapterId" element={<PrivateRoute><ChapterPage /></PrivateRoute>} />
            <Route path="/courses/:courseId/chapters/:chapterId/exam" element={<PrivateRoute><ExamPage /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
            <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute><AdminUsersPage /></PrivateRoute>} />
            <Route path="/admin/grading" element={<PrivateRoute><AdminGradingPage /></PrivateRoute>} />
            <Route path="/admin/students/:id" element={<PrivateRoute><StudentProgressPage /></PrivateRoute>} />
            <Route path="/admin/courses/:courseId/chapters" element={<PrivateRoute><AdminChaptersPage /></PrivateRoute>} />
            <Route path="/admin/courses/:courseId/content" element={<PrivateRoute><AdminContentPage /></PrivateRoute>} />
            <Route path="/admin/courses/:courseId/chapters/:chapterId/questions" element={<PrivateRoute><AdminQuestionsPage /></PrivateRoute>} />
            <Route path="/admin/courses/:courseId/chapters/:chapterId/content" element={<PrivateRoute><AdminContentPage /></PrivateRoute>} />
            <Route path="/admin/courses/:courseId/questions" element={<PrivateRoute><AdminQuestionsPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
