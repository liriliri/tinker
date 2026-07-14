import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import { LANGUAGES } from './lib/languages'
import { THEMES } from './lib/themes'
import {
  FORMATTABLE_LANGUAGES,
  isFormattable,
  formatCode,
} from './lib/formatter'
import { saveCodeImage } from './lib/exportImage'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    generate,
  })
}

async function generate(
  store: Store,
  args: {
    code: string
    path: string
    language?: string
    theme?: string
    darkMode?: boolean
    showLineNumbers?: boolean
    fileName?: string
    format?: boolean
  }
) {
  let code = args.code
  const languageKey = args.language ?? store.languageKey
  const themeId = args.theme ?? store.selectedTheme.id
  const darkMode = args.darkMode ?? store.darkMode
  const showLineNumbers = args.showLineNumbers ?? store.showLineNumbers
  const fileName = args.fileName ?? store.fileName
  const shouldFormat = args.format ?? false

  const language = LANGUAGES[languageKey]
  if (!language) {
    throw new Error(
      `Unknown language "${languageKey}". Valid: ${Object.keys(LANGUAGES).join(
        ', '
      )}.`
    )
  }

  const theme = THEMES[themeId]
  if (!theme) {
    throw new Error(
      `Unknown theme "${themeId}". Valid: ${Object.keys(THEMES).join(', ')}.`
    )
  }

  if (shouldFormat) {
    if (!isFormattable(languageKey)) {
      throw new Error(
        `Language "${languageKey}" is not formattable. Supported: ${FORMATTABLE_LANGUAGES.join(
          ', '
        )}.`
      )
    }
    code = await formatCode(code, languageKey)
  }

  store.setCode(code)
  store.setLanguage(language)
  store.setTheme(theme)
  store.setDarkMode(darkMode)
  store.setShowLineNumbers(showLineNumbers)
  store.setFileName(fileName)

  const savedPath = await saveCodeImage(args.path, true)
  return {
    savedPath,
    code,
    language: languageKey,
    theme: themeId,
    darkMode,
    showLineNumbers,
    fileName,
  }
}
