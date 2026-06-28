import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ContentViewer, { sanitizeHtml, looksLikeHtml } from '../components/ContentViewer'
import api from '../api/axios'

interface Chapter {
  id: number
  title: string
  description: string | null
}

interface ContentItem {
  id: number
  content_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'PDF' | 'LINK' | 'RICH'
  title: string
  content: string
  extra?: string | null
}

export default function ChapterPage() {
  const { courseId, chapterId } = useParams()
  const navigate = useNavigate()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [hasQuestions, setHasQuestions] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${courseId}/chapters/${chapterId}`),
      api.get(`/courses/${courseId}/chapters/${chapterId}/content`).catch(() => ({ data: [] })),
      api.get(`/courses/${courseId}/chapters/${chapterId}/exam`).catch(() => ({ data: [] })),
    ])
      .then(([chapterRes, contentRes, examRes]) => {
        setChapter(chapterRes.data)
        setContent(contentRes.data)
        setHasQuestions(Array.isArray(examRes.data) && examRes.data.length > 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [courseId, chapterId])

  if (loading) return <div className="loading">טוען...</div>
  if (!chapter) return <div className="error-msg">פרק לא נמצא</div>

  return (
    <div className="page">
      <Navbar
        subtitle={chapter.title}
        back={<button className="btn-back" onClick={() => navigate(`/courses/${courseId}`)}>← חזרה לקורס</button>}
        left={
          hasQuestions ? (
            <button
              className="btn-primary btn-nav"
              onClick={() => navigate(`/courses/${courseId}/chapters/${chapterId}/exam`)}
            >
              מבחן הפרק
            </button>
          ) : undefined
        }
      />

      <div className="page-with-sidebar">
        <Sidebar />
        <main className="main-content">
        {chapter.description && (
          looksLikeHtml(chapter.description) ? (
            <div
              className="course-desc content-html"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(chapter.description) }}
            />
          ) : (
            <p className="course-desc" style={{ whiteSpace: 'pre-wrap' }}>{chapter.description}</p>
          )
        )}

        {content.length > 0 ? (
          <section className="course-intro">
            <h2>📚 חומר הפרק</h2>
            <div className="content-list">
              {content.map((item) => (
                <ContentViewer key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : (
          <p className="empty-state">אין חומר לימוד בפרק זה עדיין</p>
        )}

        {hasQuestions && (
          <div className="exam-footer">
            <button
              className="btn-primary btn-large"
              onClick={() => navigate(`/courses/${courseId}/chapters/${chapterId}/exam`)}
            >
              התחל מבחן הפרק
            </button>
          </div>
        )}
        </main>
      </div>
    </div>
  )
}
