import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial theme
    const initTheme = async () => {
      const theme = await tinker.getTheme()
      setIsDark(theme === 'dark')
    }

    initTheme()

    // Listen for theme changes
    const handleThemeChange = async () => {
      const theme = await tinker.getTheme()
      setIsDark(theme === 'dark')
    }

    const unsubscribe = tinker.on('changeTheme', handleThemeChange)

    return () => {
      unsubscribe()
    }
  }, [])

  return isDark
}
