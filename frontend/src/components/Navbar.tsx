import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

// ============================================================================
// סרגל ניווט עליון (Navbar)
// ----------------------------------------------------------------------------
// תפקיד:
//   כותרת עליונה קבועה המוצגת בראש הדפים. כוללת את שם המערכת ("לומדת ענף 71")
//   שהוא גם קישור חזרה לדף הבית, תת-כותרת אופציונלית, וכפתור החלפת עיצוב.
//   מקבל אזורים גמישים (props) כדי שכל דף יוכל להוסיף כפתורי חזרה/פעולה משלו.
//
// מבנה עיקרי / props:
//   • subtitle — תת-כותרת (למשל שם הקורס הנוכחי).
//   • left     — תוכן נוסף בצד (כפתורי ניווט/פעולות ספציפיים לדף).
//   • back     — כפתור חזרה מותאם.
// ============================================================================

interface NavbarProps {
  subtitle?: string       // תת-כותרת (למשל שם הקורס)
  left?: ReactNode        // תוכן בצד ימין (כפתורי ניווט/פעולות)
  back?: ReactNode        // כפתור חזרה
}

export default function Navbar({ subtitle, left, back }: NavbarProps) {
  const navigate = useNavigate()
  return (
    <header className="navbar">
      <div className="navbar-start">
        {back}
        <div className="navbar-titles">
          <h1
            className="logo logo-link"
            onClick={() => navigate('/')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/') }}
            title="חזרה לדף הבית"
          >
            לומדת ענף 71
          </h1>
          {subtitle && <span className="navbar-subtitle">{subtitle}</span>}
        </div>
      </div>
      <div className="nav-right">
        {left}
        <ThemeToggle />
      </div>
    </header>
  )
}
