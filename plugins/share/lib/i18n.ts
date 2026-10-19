import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { isOnline } from './util'

interface Locales {
  'en-US': object
  'zh-CN': object
}

const pendingNamespaces: {
  ns: string
  locales: Record<string, Record<string, string>>
}[] = []

function applyNamespace(
  ns: string,
  locales: Record<string, Record<string, string>>
) {
  for (const [lng, resources] of Object.entries(locales)) {
    if (!i18n.hasResourceBundle(lng, ns)) {
      i18n.addResourceBundle(lng, ns, resources)
    }
  }
}

function languageFromIntl() {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase()
  return locale.startsWith('zh') ? 'zh-CN' : 'en-US'
}

export async function initI18n(locales: Locales) {
  i18n.use(initReactI18next).init({
    resources: {
      'en-US': { translation: locales['en-US'] },
      'zh-CN': { translation: locales['zh-CN'] },
    },
    lng: 'en-US',
    fallbackLng: 'en-US',
    interpolation: { escapeValue: false },
  })

  for (const { ns, locales } of pendingNamespaces) {
    applyNamespace(ns, locales)
  }
  pendingNamespaces.length = 0

  const language = isOnline() ? languageFromIntl() : await tinker.getLanguage()
  i18n.changeLanguage(language)
}

export function addI18nNamespace(
  ns: string,
  locales: Record<string, Record<string, string>>
) {
  if (!i18n.isInitialized) {
    pendingNamespaces.push({ ns, locales })
    return
  }
  applyNamespace(ns, locales)
}
