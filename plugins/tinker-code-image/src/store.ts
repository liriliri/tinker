import { makeAutoObservable } from 'mobx'
import { CSSProperties } from 'react'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/store/Base'
import { type Language, LANGUAGES } from './lib/languages'
import {
  type Theme,
  type FrameColors,
  THEMES,
  convertToCmTheme,
} from './lib/themes'
import isStrBlank from 'licia/isStrBlank'
import isUndef from 'licia/isUndef'
import findKey from 'licia/findKey'

const storage = new LocalStore('tinker-code-image')
const STORAGE_LANGUAGE = 'language'
const STORAGE_THEME = 'theme'
const STORAGE_DARK_MODE = 'darkMode'
const STORAGE_SHOW_LINE_NUMBERS = 'showLineNumbers'
const STORAGE_CODE = 'code'
const STORAGE_FILE_NAME = 'fileName'

export { Language, Theme, LANGUAGES, THEMES }

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
  code: string = defaultCode
  selectedLanguage: Language = LANGUAGES.javascript

  selectedTheme: Theme = THEMES.candy
  darkMode: boolean = true

  fileName: string = ''

  showLineNumbers: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
  }

  private loadStorage() {
    const savedLanguage = storage.get(STORAGE_LANGUAGE)
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      this.selectedLanguage = LANGUAGES[savedLanguage]
    }

    const savedTheme = storage.get(STORAGE_THEME)
    if (savedTheme && THEMES[savedTheme]) {
      this.selectedTheme = THEMES[savedTheme]
    }

    const savedDarkMode = storage.get(STORAGE_DARK_MODE)
    if (savedDarkMode !== undefined) {
      this.darkMode = savedDarkMode
    }

    const savedShowLineNumbers = storage.get(STORAGE_SHOW_LINE_NUMBERS)
    if (savedShowLineNumbers !== undefined) {
      this.showLineNumbers = savedShowLineNumbers
    }

    const savedCode = storage.get(STORAGE_CODE)
    if (!isUndef(savedCode) && !isStrBlank(savedCode)) {
      this.code = savedCode
    }

    const savedFileName = storage.get(STORAGE_FILE_NAME)
    if (!isUndef(savedFileName) && !isStrBlank(savedFileName)) {
      this.fileName = savedFileName
    }
  }

  setCode(code: string) {
    this.code = code
    storage.set(STORAGE_CODE, code)
  }

  setLanguage(language: Language) {
    this.selectedLanguage = language
    const langKey = findKey(LANGUAGES, (value) => value === language)
    if (langKey) {
      storage.set(STORAGE_LANGUAGE, langKey)
    }
  }

  setTheme(theme: Theme) {
    this.selectedTheme = theme
    storage.set(STORAGE_THEME, theme.id)
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode
    storage.set(STORAGE_DARK_MODE, this.darkMode)
  }

  setShowLineNumbers(show: boolean) {
    this.showLineNumbers = show
    storage.set(STORAGE_SHOW_LINE_NUMBERS, this.showLineNumbers)
  }

  setFileName(fileName: string) {
    this.fileName = fileName
    storage.set(STORAGE_FILE_NAME, fileName)
  }

  get themeCSS(): CSSProperties {
    const syntaxColors = this.darkMode
      ? this.selectedTheme.syntax.dark
      : this.selectedTheme.syntax.light
    return convertToCmTheme(syntaxColors)
  }

  get languageKey(): string {
    return (
      findKey(
        LANGUAGES,
        (value) => value.name === this.selectedLanguage.name
      ) || ''
    )
  }

  get frameColors(): FrameColors {
    return this.darkMode
      ? this.selectedTheme.frame.dark
      : this.selectedTheme.frame.light
  }
}

const store = new Store()

export default store
