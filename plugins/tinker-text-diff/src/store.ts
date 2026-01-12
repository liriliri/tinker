import { makeAutoObservable } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

type ViewMode = 'edit' | 'diff'

const STORAGE_KEY = 'content'
const MODE_STORAGE_KEY = 'mode'
const LANGUAGE_STORAGE_KEY = 'language'

const storage = new LocalStore('tinker-text-diff')

interface DiffStats {
  additions: number
  deletions: number
}

class Store extends BaseStore {
  originalText: string = ''
  modifiedText: string = ''
  mode: ViewMode = 'edit'
  diffStats: DiffStats = { additions: 0, deletions: 0 }
  language: string = 'plaintext'
  originalFileName: string = ''
  modifiedFileName: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  get isEmpty() {
    return isStrBlank(this.originalText) && isStrBlank(this.modifiedText)
  }

  setDiffStats(stats: DiffStats) {
    this.diffStats = stats
  }

  private loadFromStorage() {
    const savedContent = storage.get(STORAGE_KEY)
    const savedMode = storage.get(MODE_STORAGE_KEY)
    const savedLanguage = storage.get(LANGUAGE_STORAGE_KEY)

    if (savedContent) {
      try {
        const { original, modified } = JSON.parse(savedContent)
        this.originalText = original || ''
        this.modifiedText = modified || ''
        // eslint-disable-next-line no-empty
      } catch {}
    }

    if (savedMode) {
      this.mode = savedMode as ViewMode
    }

    if (savedLanguage) {
      this.language = savedLanguage
    }
  }

  private saveToStorage() {
    storage.set(
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
    storage.set(MODE_STORAGE_KEY, mode)
  }

  setLanguage(language: string) {
    this.language = language
    storage.set(LANGUAGE_STORAGE_KEY, language)
  }

  setOriginalFileName(fileName: string) {
    this.originalFileName = fileName
  }

  setModifiedFileName(fileName: string) {
    this.modifiedFileName = fileName
  }
}

export default new Store()
