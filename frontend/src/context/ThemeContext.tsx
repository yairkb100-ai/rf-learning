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

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light'
  })

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

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
