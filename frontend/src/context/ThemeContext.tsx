import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// ערכות הנושא הזמינות — יום / לילה בלבד
export const THEMES = [
  { id: 'light', name: 'בהיר', swatch: '#ffffff' },
  { id: 'dark', name: 'כהה', swatch: '#1c1d1f' },
] as const

export type Theme = (typeof THEMES)[number]['id']

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

// ============================================================================
// קונטקסט העיצוב (Theme Context)
// ----------------------------------------------------------------------------
// תפקיד:
//   מנהל את ערכת הנושא (בהיר/כהה) עבור כל האפליקציה ומשמר אותה בין ביקורים.
//
// מה ה-context מספק:
//   • theme       — ערכת הנושא הנוכחית ('light' או 'dark').
//   • setTheme    — קובע ערכת נושא מפורשת.
//   • toggleTheme — מחליף בין בהיר לכהה (משמש את כפתור הירח ב-Navbar/ThemeToggle).
//
// הקשר במערכת:
//   נטען ב-App.tsx ועוטף את כל הדפים. שינוי ה-theme מעדכן את התכונה
//   data-theme על אלמנט ה-<html>, וה-CSS מגיב לכך ומחליף צבעים.
// ============================================================================

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // ערך התחלתי: נטען מ-localStorage אם נשמר בעבר, אחרת ברירת מחדל 'light'.
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light'
  })

  // בכל שינוי theme: מעדכן את התכונה data-theme על אלמנט השורש (ל-CSS)
  // ושומר את הבחירה ב-localStorage לביקורים הבאים.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
  }

  // החלפה מהירה בין בהיר לכהה (לכפתור הירח)
  function toggleTheme() {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook נוח לצריכת קונטקסט העיצוב. זורק שגיאה אם נעשה בו שימוש מחוץ ל-ThemeProvider.
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
