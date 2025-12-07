import { makeAutoObservable } from 'mobx'

const STORAGE_KEY = 'tinker-markdown-editor-content'

class Store {
  markdownInput: string = ''
  history: string[] = []
  historyIndex: number = -1
  isUndoRedo: boolean = false
  isDark: boolean = false
  scrollPercent: number = 0

  constructor() {
    makeAutoObservable(this)
    this.loadFromStorage()
    this.initTheme()
  }

  get isEmpty() {
    return !this.markdownInput.trim()
  }

  get canUndo() {
    return this.historyIndex > 0
  }

  get canRedo() {
    return this.historyIndex < this.history.length - 1
  }

  get lineCount() {
    if (!this.markdownInput) return 0
    return this.markdownInput.split('\n').length
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

    if (savedContent) {
      this.markdownInput = savedContent
      this.history = [savedContent]
      this.historyIndex = 0
    } else {
      this.history = ['']
      this.historyIndex = 0
    }
  }

  setMarkdownInput(value: string) {
    this.markdownInput = value
    localStorage.setItem(STORAGE_KEY, value)

    // Add to history if not from undo/redo
    if (!this.isUndoRedo) {
      // Remove any history after current index
      this.history = this.history.slice(0, this.historyIndex + 1)
      // Add new state
      this.history.push(value)
      // Limit history size to 50 entries
      if (this.history.length > 50) {
        this.history.shift()
      } else {
        this.historyIndex++
      }
    }
    this.isUndoRedo = false
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.markdownInput)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      this.setMarkdownInput(text)
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  loadFromFile(content: string) {
    this.setMarkdownInput(content)
  }

  async openFile() {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md,.markdown,text/markdown'

      return new Promise<void>((resolve, reject) => {
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            try {
              const text = await file.text()
              this.loadFromFile(text)
              resolve()
            } catch (err) {
              console.error('Failed to read file:', err)
              reject(err)
            }
          } else {
            resolve()
          }
        }

        input.oncancel = () => {
          resolve()
        }

        input.click()
      })
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  clearMarkdown() {
    this.setMarkdownInput('')
  }

  undo() {
    if (this.canUndo) {
      this.historyIndex--
      this.isUndoRedo = true
      this.markdownInput = this.history[this.historyIndex]
      localStorage.setItem(STORAGE_KEY, this.markdownInput)
    }
  }

  redo() {
    if (this.canRedo) {
      this.historyIndex++
      this.isUndoRedo = true
      this.markdownInput = this.history[this.historyIndex]
      localStorage.setItem(STORAGE_KEY, this.markdownInput)
    }
  }

  setScrollPercent(percent: number) {
    this.scrollPercent = percent
  }
}

export default new Store()
