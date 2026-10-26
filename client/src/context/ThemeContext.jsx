import { createContext, useContext, useEffect, useState } from 'react'

export const THEME_KEY = 'imovies_theme'
const ThemeContext = createContext(null)

function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* storage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    // Bootstrap 5.3 reads data-bs-theme; our CSS tokens key off it too.
    document.documentElement.setAttribute('data-bs-theme', theme)
  }, [theme])

  const toggle = () => {
    const html = document.documentElement
    html.classList.add('theme-anim')
    setTimeout(() => html.classList.remove('theme-anim'), 300)
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(THEME_KEY, next) } catch { /* ignore */ }
      return next
    })
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext)
}
