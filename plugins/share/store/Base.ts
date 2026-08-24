import LocalStore from 'licia/LocalStore'

const STORAGE_PROP = '__TINKER_PLUGIN_STORAGE__'

type StorageHolder = Window & {
  [STORAGE_PROP]?: LocalStore
}

/**
 * Plugin-scoped persistent storage (namespace = plugin id from URL).
 * Child windows opened via window.open reuse the opener's LocalStore so
 * in-memory cache and localStorage stay in sync.
 */
function createPluginStorage(): LocalStore {
  const w = window as StorageHolder
  try {
    const fromOpener = (window.opener as StorageHolder | null)?.[STORAGE_PROP]
    if (fromOpener) {
      w[STORAGE_PROP] = fromOpener
      return fromOpener
    }
  } catch {
    // Cross-origin opener
  }

  if (!w[STORAGE_PROP]) {
    w[STORAGE_PROP] = new LocalStore(location.host)
  }
  return w[STORAGE_PROP]
}

export const storage = createPluginStorage()

/**
 * BaseStore - Base store class for all Tinker plugin stores
 * Provides common functionality like theme management
 */
export default class BaseStore {
  isDark: boolean = false

  constructor() {
    // Don't call makeAutoObservable here - let subclasses call it
    // This avoids conflicts when subclasses also call makeAutoObservable
    this.initTheme()
  }

  setIsDark(isDark: boolean) {
    this.isDark = isDark
  }

  protected async initTheme() {
    try {
      const theme = await tinker.getTheme()
      this.isDark = theme === 'dark'

      tinker.on('changeTheme', async () => {
        const newTheme = await tinker.getTheme()
        this.setIsDark(newTheme === 'dark')
      })
    } catch (err) {
      console.error('Failed to initialize theme:', err)
    }
  }
}
