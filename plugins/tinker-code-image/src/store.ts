import { makeAutoObservable } from 'mobx'
import type { Highlighter } from 'shiki'
import { CSSProperties } from 'react'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { type Language, LANGUAGES } from './lib/languages'
import {
  type Theme,
  type FrameColors,
  THEMES,
  convertToShikiTheme,
  shikiTheme,
} from './lib/themes'
import isStrBlank from 'licia/isStrBlank'
import isUndef from 'licia/isUndef'

const storage = new LocalStore('tinker-code-image')
const STORAGE_KEY_LANGUAGE = 'language'
const STORAGE_KEY_THEME = 'theme'
const STORAGE_KEY_DARK_MODE = 'darkMode'
const STORAGE_KEY_SHOW_LINE_NUMBERS = 'showLineNumbers'
const STORAGE_KEY_CODE = 'code'
const STORAGE_KEY_FILE_NAME = 'fileName'

export { Language, Theme, LANGUAGES, THEMES, shikiTheme }

const defaultCode = `import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`

class Store extends BaseStore {
  highlighter: Highlighter | null = null

  code: string = defaultCode
  selectedLanguage: Language = LANGUAGES.javascript

  selectedTheme: Theme = THEMES.candy
  darkMode: boolean = true

  fileName: string = ''

  showLineNumbers: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  private loadFromStorage() {
    const savedLanguage = storage.get(STORAGE_KEY_LANGUAGE)
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      this.selectedLanguage = LANGUAGES[savedLanguage]
    }

    const savedTheme = storage.get(STORAGE_KEY_THEME)
    if (savedTheme && THEMES[savedTheme]) {
      this.selectedTheme = THEMES[savedTheme]
    }

    const savedDarkMode = storage.get(STORAGE_KEY_DARK_MODE)
    if (savedDarkMode !== undefined) {
      this.darkMode = savedDarkMode
    }

    const savedShowLineNumbers = storage.get(STORAGE_KEY_SHOW_LINE_NUMBERS)
    if (savedShowLineNumbers !== undefined) {
      this.showLineNumbers = savedShowLineNumbers
    }

    const savedCode = storage.get(STORAGE_KEY_CODE)
    if (!isUndef(savedCode) && !isStrBlank(savedCode)) {
      this.code = savedCode
    }

    const savedFileName = storage.get(STORAGE_KEY_FILE_NAME)
    if (!isUndef(savedFileName) && !isStrBlank(savedFileName)) {
      this.fileName = savedFileName
    }
  }

  setHighlighter(highlighter: Highlighter) {
    this.highlighter = highlighter
  }

  setCode(code: string) {
    this.code = code
    storage.set(STORAGE_KEY_CODE, code)
  }

  setLanguage(language: Language) {
    this.selectedLanguage = language
    const langKey = Object.keys(LANGUAGES).find(
      (key) => LANGUAGES[key] === language
    )
    if (langKey) {
      storage.set(STORAGE_KEY_LANGUAGE, langKey)
    }
  }

  setTheme(theme: Theme) {
    this.selectedTheme = theme
    storage.set(STORAGE_KEY_THEME, theme.id)
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode
    storage.set(STORAGE_KEY_DARK_MODE, this.darkMode)
  }

  toggleLineNumbers() {
    this.showLineNumbers = !this.showLineNumbers
    storage.set(STORAGE_KEY_SHOW_LINE_NUMBERS, this.showLineNumbers)
  }

  setShowLineNumbers(show: boolean) {
    this.showLineNumbers = show
    storage.set(STORAGE_KEY_SHOW_LINE_NUMBERS, this.showLineNumbers)
  }

  setFileName(fileName: string) {
    this.fileName = fileName
    storage.set(STORAGE_KEY_FILE_NAME, fileName)
  }

  get themeCSS(): CSSProperties {
    const syntaxColors = this.darkMode
      ? this.selectedTheme.syntax.dark
      : this.selectedTheme.syntax.light
    return convertToShikiTheme(syntaxColors)
  }

  get frameColors(): FrameColors {
    return this.darkMode
      ? this.selectedTheme.frame.dark
      : this.selectedTheme.frame.light
  }
}

const store = new Store()

export default store
