import type { languages } from 'monaco-editor'

export interface LanguageInfo {
  id: string
  label: string
  extensions: string[]
}

let cachedLanguages: LanguageInfo[] | null = null
let cachedExtMap: Map<string, string> | null = null

export function getLanguages(
  monacoLanguages: typeof languages
): LanguageInfo[] {
  if (cachedLanguages) return cachedLanguages

  cachedLanguages = monacoLanguages
    .getLanguages()
    .map((lang) => ({
      id: lang.id,
      label: (lang as { aliases?: string[] }).aliases?.[0] ?? lang.id,
      extensions: (lang.extensions ?? []).map((ext) =>
        ext.startsWith('.') ? ext.slice(1) : ext
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return cachedLanguages
}

export function getExtensionMap(
  monacoLanguages: typeof languages
): Map<string, string> {
  if (cachedExtMap) return cachedExtMap

  cachedExtMap = new Map()
  for (const lang of getLanguages(monacoLanguages)) {
    for (const ext of lang.extensions) {
      if (!cachedExtMap.has(ext)) {
        cachedExtMap.set(ext, lang.id)
      }
    }
  }

  return cachedExtMap
}

export function detectLanguage(
  filePath: string,
  monacoLanguages: typeof languages
): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (!ext) return 'plaintext'
  return getExtensionMap(monacoLanguages).get(ext) ?? 'plaintext'
}
