import { makeAutoObservable } from 'mobx'
import isStrBlank from 'licia/isStrBlank'

type ViewMode = 'edit' | 'diff'

const STORAGE_KEY = 'tinker-text-diff-content'
const MODE_STORAGE_KEY = 'tinker-text-diff-mode'
const LANGUAGE_STORAGE_KEY = 'tinker-text-diff-language'

interface DiffStats {
  additions: number
  deletions: number
}

class Store {
  originalText: string = ''
  modifiedText: string = ''
  mode: ViewMode = 'edit'
  diffStats: DiffStats = { additions: 0, deletions: 0 }
  isDark: boolean = false
  language: string = 'plaintext'
  originalFileName: string = ''
  modifiedFileName: string = ''

  constructor() {
    makeAutoObservable(this)
    this.loadFromStorage()
    this.initTheme()
  }

  get isEmpty() {
    return isStrBlank(this.originalText) && isStrBlank(this.modifiedText)
  }

  setDiffStats(stats: DiffStats) {
    this.diffStats = stats
  }

  setIsDark(isDark: boolean) {
    this.isDark = isDark
  }

  private async initTheme() {
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

  private loadFromStorage() {
    const savedContent = localStorage.getItem(STORAGE_KEY)
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY)
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)

    if (savedContent) {
      try {
        const { original, modified } = JSON.parse(savedContent)
        this.originalText = original || ''
        this.modifiedText = modified || ''
      } catch (err) {
        // Ignore parsing errors
      }
    }

    if (savedMode) {
      this.mode = savedMode as ViewMode
    }

    if (savedLanguage) {
      this.language = savedLanguage
    }
  }

  private saveToStorage() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        original: this.originalText,
        modified: this.modifiedText,
      })
    )
  }

  setOriginalText(value: string) {
    this.originalText = value
    this.saveToStorage()
  }

  setModifiedText(value: string) {
    this.modifiedText = value
    this.saveToStorage()
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      this.setModifiedText(text)
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  async pasteToOriginal() {
    try {
      const text = await navigator.clipboard.readText()
      this.setOriginalText(text)
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  async pasteToModified() {
    try {
      const text = await navigator.clipboard.readText()
      this.setModifiedText(text)
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  clearOriginal() {
    this.originalText = ''
    this.saveToStorage()
  }

  clearModified() {
    this.modifiedText = ''
    this.saveToStorage()
  }

  clearText() {
    this.originalText = ''
    this.modifiedText = ''
    this.saveToStorage()
  }

  swapTexts() {
    const temp = this.originalText
    this.originalText = this.modifiedText
    this.modifiedText = temp
    this.saveToStorage()
  }

  setMode(mode: ViewMode) {
    this.mode = mode
    localStorage.setItem(MODE_STORAGE_KEY, mode)
  }

  setLanguage(language: string) {
    this.language = language
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }

  setOriginalFileName(fileName: string) {
    this.originalFileName = fileName
  }

  setModifiedFileName(fileName: string) {
    this.modifiedFileName = fileName
  }
}

export default new Store()
