import { makeAutoObservable } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/store/Base'

const STORAGE_HTML = 'html'
const STORAGE_CSS = 'css'
const STORAGE_JS = 'js'
const STORAGE_DEV_TOOLS = 'devTools'
const STORAGE_DEV_TOOLS_POSITION = 'devToolsPosition'
const STORAGE_VISIBLE_PANELS = 'visiblePanels'
const STORAGE_LAYOUT = 'layout'

const storage = new LocalStore('tinker-web-runner')

class Store extends BaseStore {
  html = ''
  css = ''
  js = ''
  port = 0
  previewDark = false
  devTools = false
  devToolsPosition: 'bottom' | 'left' | 'right' = 'bottom'
  showHtml = true
  showCss = true
  showJs = true
  layout: 'right' | 'left' | 'top' | 'bottom' = 'right'
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

    const savedDevTools = storage.get<boolean | undefined>(STORAGE_DEV_TOOLS)
    if (savedDevTools !== undefined) this.devTools = savedDevTools

    const savedPosition = storage.get<string | undefined>(
      STORAGE_DEV_TOOLS_POSITION
    )
    if (
      savedPosition === 'bottom' ||
      savedPosition === 'left' ||
      savedPosition === 'right'
    ) {
      this.devToolsPosition = savedPosition
    }

    const savedPanels = storage.get<
      { html: boolean; css: boolean; js: boolean } | undefined
    >(STORAGE_VISIBLE_PANELS)
    if (savedPanels) {
      this.showHtml = savedPanels.html
      this.showCss = savedPanels.css
      this.showJs = savedPanels.js
    }

    const savedLayout = storage.get<string | undefined>(STORAGE_LAYOUT)
    if (
      savedLayout === 'right' ||
      savedLayout === 'left' ||
      savedLayout === 'top' ||
      savedLayout === 'bottom'
    ) {
      this.layout = savedLayout
    }
  }

  private initServer() {
    const check = () => {
      const p = webRunner.getPort()
      if (p > 0) {
        this.port = p
        this.run()
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

  openDevTools() {
    this.devTools = true
    storage.set(STORAGE_DEV_TOOLS, true)
  }

  closeDevTools() {
    this.devTools = false
    storage.set(STORAGE_DEV_TOOLS, false)
  }

  setDevToolsPosition(position: 'bottom' | 'left' | 'right') {
    this.devToolsPosition = position
    storage.set(STORAGE_DEV_TOOLS_POSITION, position)
  }

  togglePanel(panel: 'html' | 'css' | 'js') {
    const key =
      panel === 'html' ? 'showHtml' : panel === 'css' ? 'showCss' : 'showJs'
    const visibleCount =
      (this.showHtml ? 1 : 0) + (this.showCss ? 1 : 0) + (this.showJs ? 1 : 0)

    if (this[key] && visibleCount <= 1) return

    this[key] = !this[key]
    storage.set(STORAGE_VISIBLE_PANELS, {
      html: this.showHtml,
      css: this.showCss,
      js: this.showJs,
    })
  }

  setLayout(layout: 'right' | 'left' | 'top' | 'bottom') {
    this.layout = layout
    storage.set(STORAGE_LAYOUT, layout)
  }

  setCursor(editor: 'html' | 'css' | 'js', line: number, col: number) {
    this[`${editor}Cursor`] = { line, col }
  }

  run() {
    webRunner.updateCode(this.html, this.css, this.js, this.previewDark)
  }

  async saveToDirectory() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled || !result.filePaths.length) return

    const dir = result.filePaths[0]
    const hasCss = !isStrBlank(this.css)
    const hasJs = !isStrBlank(this.js)

    let html = this.html
    if (!html.includes('<html')) {
      const cssLink = hasCss ? '<link rel="stylesheet" href="style.css">' : ''
      const jsScript = hasJs ? '<script src="script.js"></script>' : ''
      html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${cssLink}
</head>
<body>
${html}
${jsScript}
</body>
</html>`
    }

    const indexPath = `${dir}/index.html`
    await tinker.writeFile(indexPath, html)
    if (hasCss) {
      await tinker.writeFile(`${dir}/style.css`, this.css)
    }
    if (hasJs) {
      await tinker.writeFile(`${dir}/script.js`, this.js)
    }

    tinker.showItemInPath(indexPath)
  }

  get previewUrl(): string {
    if (this.port === 0) return ''
    return `http://127.0.0.1:${this.port}`
  }
}

export default new Store()
