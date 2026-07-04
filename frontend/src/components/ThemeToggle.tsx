import { useTheme } from '../context/ThemeContext'

// ============================================================================
// כפתור החלפת עיצוב (ThemeToggle)
// ----------------------------------------------------------------------------
// תפקיד:
//   כפתור קטן (אייקון ירח/שמש) המחליף בין מצב בהיר לכהה בלחיצה.
//   משתמש ב-toggleTheme מקונטקסט העיצוב. מוצג בדרך כלל ב-Navbar.
// ============================================================================

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
