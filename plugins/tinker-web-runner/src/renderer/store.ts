import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

const STORAGE_HTML = 'html'
const STORAGE_CSS = 'css'
const STORAGE_JS = 'js'

const storage = new LocalStore('tinker-web-runner')

class Store extends BaseStore {
  html = ''
  css = ''
  js = ''
  port = 0
  previewDark = false
  htmlCursor = { line: 1, col: 1 }
  cssCursor = { line: 1, col: 1 }
  jsCursor = { line: 1, col: 1 }

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
    this.initServer()
  }

  private loadStorage() {
    const savedHtml = storage.get<string | undefined>(STORAGE_HTML)
    const savedCss = storage.get<string | undefined>(STORAGE_CSS)
    const savedJs = storage.get<string | undefined>(STORAGE_JS)

    if (savedHtml !== undefined) this.html = savedHtml
    if (savedCss !== undefined) this.css = savedCss
    if (savedJs !== undefined) this.js = savedJs
  }

  private initServer() {
    const check = () => {
      const p = webRunner.getPort()
      if (p > 0) {
        this.port = p
      } else {
        setTimeout(check, 50)
      }
    }
    check()
  }

  setHtml(value: string) {
    this.html = value
    storage.set(STORAGE_HTML, value)
  }

  setCss(value: string) {
    this.css = value
    storage.set(STORAGE_CSS, value)
  }

  setJs(value: string) {
    this.js = value
    storage.set(STORAGE_JS, value)
  }

  togglePreviewDark() {
    this.previewDark = !this.previewDark
  }

  setCursor(editor: 'html' | 'css' | 'js', line: number, col: number) {
    this[`${editor}Cursor`] = { line, col }
  }

  run() {
    webRunner.updateCode(this.html, this.css, this.js, this.previewDark)
  }

  get previewUrl(): string {
    if (this.port === 0) return ''
    return `http://127.0.0.1:${this.port}`
  }
}

export default new Store()
