import { useTheme } from '../context/ThemeContext'

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
