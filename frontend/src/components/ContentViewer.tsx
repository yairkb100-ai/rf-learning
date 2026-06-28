interface ContentItem {
  id: number
  content_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'PDF' | 'LINK' | 'RICH'
  title: string
  content: string
  extra?: string | null
}

// אייקון לפי סוג המסמך
function fileIcon(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() || ''
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['ppt', 'pptx'].includes(ext)) return '📽️'
  return '📄'
}

// בודק אם זה קישור YouTube ומחזיר embed URL
function youtubeEmbed(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  )
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

// מנקה HTML מסכנות: מסיר תגיות מסוכנות (script/iframe וכו') ומאפייני on*.
// משאיר תגיות עיצוב בסיסיות (b/i/u/ul/ol/li/h3/span/div/br/p וכו').
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const allowed = new Set([
    'B', 'STRONG', 'I', 'EM', 'U', 'P', 'BR', 'DIV', 'SPAN',
    'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'FONT', 'A',
  ])
  doc.body.querySelectorAll('*').forEach((el) => {
    if (!allowed.has(el.tagName)) {
      el.replaceWith(...Array.from(el.childNodes))
      return
    }
    // הסרת מאפייני on* ו-href/src מסוכנים
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase()
      const val = attr.value.toLowerCase()
      const keep =
        name === 'style' ||
        name === 'color' ||
        name === 'size' ||
        name === 'align' ||
        name === 'dir' ||
        (el.tagName === 'A' && name === 'href' && !val.startsWith('javascript:'))
      if (!keep) el.removeAttribute(attr.name)
    })
    if (el.tagName === 'A') {
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noopener noreferrer')
    }
  })
  return doc.body.innerHTML
}

// מזהה אם המחרוזת מכילה HTML (מהעורך החדש) או טקסט רגיל (תוכן ישן)
export function looksLikeHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(s)
}

// תוכן HTML שמכיל ירידות שורה גולמיות (\n) "נבלע" כי HTML מכווץ רווחים לבנים.
// כאן מסירים ירידות שורה הצמודות לתגיות בלוק (p/ul/li/h*) — שם המרווח כבר מטופל ב-CSS —
// וממירים את שאר ירידות השורה ל-<br> כדי לשמר את הפיסוק של תוכן ישן (גוש עם \n בלבד).
function preserveLineBreaks(html: string): string {
  const block = '(?:p|div|ul|ol|li|h[1-4]|br)'
  return html
    .replace(new RegExp(`\\s*\\n\\s*(?=</?${block}[ >/])`, 'gi'), '')
    .replace(new RegExp(`(</?${block}[^>]*>)\\s*\\n\\s*`, 'gi'), '$1')
    .replace(/\n/g, '<br>')
}

function RichText({ content }: { content: string }) {
  if (looksLikeHtml(content)) {
    return (
      <div
        className="content-text content-html"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(preserveLineBreaks(content)) }}
      />
    )
  }
  // תוכן ישן (טקסט רגיל) — שמירה על ירידות שורה
  return <p className="content-text">{content}</p>
}

export default function ContentViewer({ item }: { item: ContentItem }) {
  return (
    <div className="content-item">
      <h4 className="content-item-title">{item.title}</h4>

      {item.content_type === 'TEXT' && <RichText content={item.content} />}

      {item.content_type === 'RICH' && (
        <div className="content-rich">
          {item.content && <RichText content={item.content} />}
          {item.extra && <img src={item.extra} alt={item.title} className="content-image" />}
        </div>
      )}

      {item.content_type === 'IMAGE' && (
        <img src={item.content} alt={item.title} className="content-image" />
      )}

      {item.content_type === 'VIDEO' && (
        (() => {
          const yt = youtubeEmbed(item.content)
          if (yt) {
            return (
              <div className="content-video-wrap">
                <iframe
                  src={yt}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )
          }
          return (
            <video controls className="content-video">
              <source src={item.content} />
              הדפדפן שלך לא תומך בנגן וידאו
            </video>
          )
        })()
      )}

      {item.content_type === 'PDF' && (
        <a href={item.content} target="_blank" rel="noopener noreferrer" className="content-pdf-link">
          {fileIcon(item.content)} פתח מסמך: {item.title}
        </a>
      )}

      {item.content_type === 'LINK' && (
        <a href={item.content} target="_blank" rel="noopener noreferrer" className="content-link">
          🔗 {item.content}
        </a>
      )}
    </div>
  )
}
