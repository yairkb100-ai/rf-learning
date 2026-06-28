import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

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
