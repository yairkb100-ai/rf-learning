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
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
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
