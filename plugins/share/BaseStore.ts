/**
 * BaseStore - Base store class for all Tinker plugin stores
 * Provides common functionality like theme management
 */
export default class BaseStore {
  isDark: boolean = false

  constructor() {
    // Don't call makeAutoObservable here - let subclasses call it
    // This avoids conflicts when subclasses also call makeAutoObservable
    this.initTheme()
  }

  setIsDark(isDark: boolean) {
    this.isDark = isDark
  }

  protected async initTheme() {
    try {
      const theme = await tinker.getTheme()
      this.isDark = theme === 'dark'

      // Listen for theme changes
      tinker.on('changeTheme', async () => {
        const newTheme = await tinker.getTheme()
        this.setIsDark(newTheme === 'dark')
      })
    } catch (err) {
      console.error('Failed to initialize theme:', err)
    }
  }
}
