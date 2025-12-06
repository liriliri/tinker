import { makeAutoObservable } from 'mobx'

type ViewMode = 'edit' | 'diff'

const STORAGE_KEY = 'tinker-text-diff-content'
const MODE_STORAGE_KEY = 'tinker-text-diff-mode'

class Store {
  originalText: string = ''
  modifiedText: string = ''
  mode: ViewMode = 'edit'

  constructor() {
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  get isEmpty() {
    return !this.originalText.trim() && !this.modifiedText.trim()
  }

  private loadFromStorage() {
    const savedContent = localStorage.getItem(STORAGE_KEY)
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY)

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
}

export default new Store()
