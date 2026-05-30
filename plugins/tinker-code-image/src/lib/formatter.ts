import { format } from 'prettier/standalone'
import babel from 'prettier/plugins/babel'
import estree from 'prettier/plugins/estree'
import typescript from 'prettier/plugins/typescript'
import postcss from 'prettier/plugins/postcss'
import html from 'prettier/plugins/html'

const FORMATTABLE_LANGUAGES = [
  'javascript',
  'typescript',
  'css',
  'html',
  'json',
] as const

type FormattableLanguage = (typeof FORMATTABLE_LANGUAGES)[number]

export function isFormattable(
  language: string
): language is FormattableLanguage {
  return (FORMATTABLE_LANGUAGES as readonly string[]).includes(language)
}

export async function formatCode(
  code: string,
  language: FormattableLanguage,
  tabWidth = 2
): Promise<string> {
  switch (language) {
    case 'javascript':
      return format(code, {
        plugins: [babel, estree],
        parser: 'babel',
        tabWidth,
      })
    case 'typescript':
      return format(code, {
        plugins: [typescript, estree],
        parser: 'typescript',
        tabWidth,
      })
    case 'css':
      return format(code, {
        plugins: [postcss],
        parser: 'css',
        tabWidth,
      })
    case 'html':
      return format(code, {
        plugins: [html],
        parser: 'html',
        tabWidth,
      })
    case 'json': {
      const indent = tabWidth === 0 ? '' : ' '.repeat(tabWidth)
      return JSON.stringify(JSON.parse(code), null, indent)
    }
  }
}
