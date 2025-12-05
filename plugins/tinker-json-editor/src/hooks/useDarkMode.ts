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

    tinker.on('changeTheme', handleThemeChange)

    // Note: tinker.on doesn't return an unsubscribe function,
    // so we can't clean up the listener in the return statement
  }, [])

  return isDark
}
