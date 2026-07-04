import { useEffect, useRef } from 'react'

// ============================================================================
// עורך טקסט עשיר (RichTextEditor)
// ----------------------------------------------------------------------------
// תפקיד:
//   עורך WYSIWYG פשוט לכתיבת תוכן מעוצב (HTML) ללא ספריות חיצוניות.
//   מבוסס על contentEditable ו-document.execCommand. מקבל value (HTML)
//   ומחזיר שינויים דרך onChange. משמש במסכי הניהול ליצירת תוכן לימודי עשיר.
//
// props:
//   • value       — ה-HTML הנוכחי המוצג בעורך.
//   • onChange     — נקרא בכל שינוי ומחזיר את ה-HTML המעודכן.
//   • placeholder  — טקסט מציין מקום כשהעורך ריק.
// ============================================================================

// עורך טקסט עשיר פשוט מבוסס contentEditable (ללא ספריות חיצוניות).
// שומר ומחזיר HTML. תומך בהדגשה, נטוי, קו תחתון, גדלים, יישור,
// רשימות (ממוספרת/תבליטים), כותרת, וצבע טקסט.
export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  // הזרקת ה-value החיצוני רק כשהוא שונה ממה שכבר בעורך
  // (כדי לא לאפס את הסמן בכל הקלדה)
  useEffect(() => {
    const el = ref.current
    if (el && el.innerHTML !== value) {
      el.innerHTML = value || ''
    }
  }, [value])

  // מריץ פקודת עיצוב (הדגשה/יישור/רשימה וכו') על הטקסט הנבחר ומדווח על השינוי.
  function exec(command: string, arg?: string) {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    emit()
  }

  // מדווח החוצה (onChange) את תוכן ה-HTML הנוכחי של העורך.
  function emit() {
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const isEmpty = !value || value === '<br>' || value.trim() === ''

  return (
    <div className="rte">
      <div className="rte-toolbar" dir="ltr">
        <button type="button" className="rte-btn" title="מודגש" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}>
          <b>B</b>
        </button>
        <button type="button" className="rte-btn" title="נטוי" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}>
          <i>I</i>
        </button>
        <button type="button" className="rte-btn" title="קו תחתון" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}>
          <u>U</u>
        </button>

        <span className="rte-sep" />

        <button type="button" className="rte-btn" title="הגדל טקסט" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('fontSize', '5')}>
          A+
        </button>
        <button type="button" className="rte-btn" title="הקטן טקסט" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('fontSize', '2')}>
          A−
        </button>
        <button type="button" className="rte-btn" title="כותרת" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'H3')}>
          כותרת
        </button>

        <span className="rte-sep" />

        <button type="button" className="rte-btn" title="יישור לימין" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyRight')}>
          ⇥
        </button>
        <button type="button" className="rte-btn" title="מרכוז" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyCenter')}>
          ≡
        </button>
        <button type="button" className="rte-btn" title="יישור לשמאל" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyLeft')}>
          ⇤
        </button>

        <span className="rte-sep" />

        <button type="button" className="rte-btn" title="רשימה ממוספרת" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')}>
          1.
        </button>
        <button type="button" className="rte-btn" title="רשימת תבליטים" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>
          •
        </button>

        <span className="rte-sep" />

        <label className="rte-btn rte-color" title="צבע טקסט">
          A
          <input
            type="color"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => exec('foreColor', e.target.value)}
          />
        </label>

        <button type="button" className="rte-btn" title="נקה עיצוב" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('removeFormat')}>
          ✕
        </button>
      </div>

      <div className="rte-editor-wrap">
        {isEmpty && placeholder && <div className="rte-placeholder">{placeholder}</div>}
        <div
          ref={ref}
          className="rte-editor"
          contentEditable
          dir="rtl"
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
        />
      </div>
    </div>
  )
}
