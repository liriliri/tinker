import { createRoot } from 'react-dom/client'
import waitUntil from 'licia/waitUntil'
import { initI18n } from './i18n'

interface Locales {
  'en-US': object
  'zh-CN': object
}

interface Options {
  /** Global variable name to wait for before rendering, e.g. `'codeEditor'`. */
  waitUntil?: string
}

export default async function renderApp(
  App: React.ComponentType,
  locales: Locales,
  options: Options = {}
) {
  await initI18n(locales)

  if (options.waitUntil) {
    const name = options.waitUntil
    await waitUntil(
      () =>
        typeof (globalThis as Record<string, unknown>)[name] !== 'undefined',
      0,
      10
    )
  }

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
}
