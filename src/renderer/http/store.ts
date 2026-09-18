import { action, makeObservable, observable, runInAction } from 'mobx'
import contain from 'licia/contain'
import lowerCase from 'licia/lowerCase'
import trim from 'licia/trim'
import { t } from 'common/util'
import { pinyinMatch } from '../main/lib/util'
import {
  apiFetch,
  BasicCredentials,
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from './lib/auth'

export interface PluginInfo {
  id: string
  name: string
  running: boolean
}

function pluginIdFromPath() {
  const match = location.pathname.match(/^\/p\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : null
}

class Store {
  plugins: PluginInfo[] = []
  filter = ''
  error = ''
  pluginId: string | null = pluginIdFromPath()
  openingId: string | null = null
  closingId: string | null = null

  authRequired = false
  authenticated = false
  authError = ''
  authReady = false
  credentials: BasicCredentials | null = loadCredentials()

  statusKey = 'connecting'
  screencastErrorKey = ''
  screencastErrorRaw = ''
  screencastActive = true

  private refreshTimer: number | null = null

  constructor() {
    makeObservable(this, {
      plugins: observable,
      filter: observable,
      error: observable,
      pluginId: observable,
      openingId: observable,
      closingId: observable,
      authRequired: observable,
      authenticated: observable,
      authError: observable,
      authReady: observable,
      credentials: observable,
      statusKey: observable,
      screencastErrorKey: observable,
      screencastErrorRaw: observable,
      screencastActive: observable,
      setFilter: action,
      setStatusKey: action,
      setScreencastErrorKey: action,
      setScreencastErrorRaw: action,
      setScreencastActive: action,
      resetScreencast: action,
    })

    void this.initAuth()
  }

  get filteredPlugins() {
    const filter = trim(this.filter)
    if (!filter) {
      return this.plugins
    }
    const lowerFilter = lowerCase(filter).replace(/-/g, '')
    return this.plugins.filter(
      (plugin) =>
        pinyinMatch(plugin.name, filter) ||
        contain(plugin.id.replace(/-/g, ''), lowerFilter)
    )
  }

  get pluginName() {
    if (!this.pluginId) {
      return ''
    }
    const plugin = this.plugins.find((item) => item.id === this.pluginId)
    return plugin?.name || this.pluginId
  }

  get status() {
    return t(this.statusKey)
  }

  get screencastError() {
    if (this.screencastErrorKey) {
      return t(this.screencastErrorKey)
    }
    return this.screencastErrorRaw
  }

  get needsLogin() {
    return this.authReady && this.authRequired && !this.authenticated
  }

  get busy() {
    return !!this.openingId || !!this.closingId
  }

  setFilter(filter: string) {
    this.filter = filter
  }

  setStatusKey(key: string) {
    this.statusKey = key
  }

  setScreencastErrorKey(key: string) {
    this.screencastErrorKey = key
    this.screencastErrorRaw = ''
  }

  setScreencastErrorRaw(message: string) {
    this.screencastErrorKey = ''
    this.screencastErrorRaw = message
  }

  setScreencastActive(active: boolean) {
    this.screencastActive = active
  }

  resetScreencast() {
    this.statusKey = 'connecting'
    this.screencastErrorKey = ''
    this.screencastErrorRaw = ''
    this.screencastActive = true
  }

  async initAuth() {
    try {
      const res = await apiFetch('/api/auth')
      const data = res.ok
        ? ((await res.json()) as { required?: boolean })
        : { required: false }
      const required = !!data.required
      runInAction(() => {
        this.authRequired = required
      })
      if (!required) {
        runInAction(() => {
          this.authenticated = true
          this.authReady = true
          this.credentials = null
        })
        clearCredentials()
        this.startData()
        return
      }
      if (this.credentials) {
        const ok = await this.verifyCredentials(this.credentials)
        if (ok) {
          runInAction(() => {
            this.authenticated = true
            this.authReady = true
          })
          this.startData()
          return
        }
        clearCredentials()
        runInAction(() => {
          this.credentials = null
        })
      }
      // Auth required but no valid credentials: stay on list login UI.
      if (this.pluginId) {
        location.replace('/')
        return
      }
      runInAction(() => {
        this.authenticated = false
        this.authReady = true
      })
    } catch {
      runInAction(() => {
        this.authRequired = false
        this.authenticated = true
        this.authReady = true
      })
      this.startData()
    }
  }

  async verifyCredentials(creds: BasicCredentials) {
    const res = await apiFetch('/api/plugins', {}, creds)
    return res.ok
  }

  async login(username: string, password: string) {
    const creds = { username, password }
    runInAction(() => {
      this.authError = ''
    })
    const ok = await this.verifyCredentials(creds)
    if (!ok) {
      runInAction(() => {
        this.authError = t('loginErr')
        this.authenticated = false
      })
      return false
    }
    saveCredentials(creds)
    runInAction(() => {
      this.credentials = creds
      this.authenticated = true
      this.authError = ''
    })
    this.startData()
    return true
  }

  private startData() {
    if (!this.pluginId) {
      this.refresh()
      if (this.refreshTimer === null) {
        this.refreshTimer = window.setInterval(() => this.refresh(), 3000)
      }
    } else {
      this.refresh()
    }
  }

  private markUnauthorized() {
    clearCredentials()
    runInAction(() => {
      this.credentials = null
      this.authenticated = false
      this.authError = t('loginErr')
    })
    if (this.pluginId) {
      location.replace('/')
    }
  }

  private async postPlugin(id: string, action: 'open' | 'close') {
    const res = await apiFetch(
      `/api/plugins/${encodeURIComponent(id)}/${action}`,
      { method: 'POST' },
      this.credentials
    )
    if (res.status === 401) {
      this.markUnauthorized()
      return false
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string
      } | null
      const fallback =
        action === 'open'
          ? t('openPluginErr', { status: res.status })
          : t('closePluginErr', { status: res.status })
      throw new Error(data?.error || fallback)
    }
    return true
  }

  async refresh() {
    if (this.authRequired && !this.authenticated) {
      return
    }
    try {
      const res = await apiFetch('/api/plugins', {}, this.credentials)
      if (res.status === 401) {
        this.markUnauthorized()
        return
      }
      if (!res.ok) {
        throw new Error(t('loadPluginsErr', { status: res.status }))
      }
      const data = (await res.json()) as PluginInfo[]
      runInAction(() => {
        this.plugins = data
        this.error = ''
      })
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.message || String(err)
      })
    }
  }

  async activatePlugin() {
    if (!this.pluginId || this.busy) return
    runInAction(() => {
      this.openingId = this.pluginId
      this.screencastErrorKey = ''
      this.screencastErrorRaw = ''
    })
    try {
      await this.postPlugin(this.pluginId, 'open')
    } catch (err: any) {
      runInAction(() => {
        this.screencastErrorRaw = err?.message || String(err)
      })
    } finally {
      runInAction(() => {
        this.openingId = null
      })
    }
  }

  async openPlugin(plugin: PluginInfo) {
    if (this.busy) return
    if (plugin.running) {
      location.assign(`/p/${encodeURIComponent(plugin.id)}`)
      return
    }
    runInAction(() => {
      this.openingId = plugin.id
      this.error = ''
    })
    try {
      const ok = await this.postPlugin(plugin.id, 'open')
      if (ok) {
        location.assign(`/p/${encodeURIComponent(plugin.id)}`)
      } else {
        runInAction(() => {
          this.openingId = null
        })
      }
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.message || String(err)
        this.openingId = null
      })
    }
  }

  async closePlugin(plugin: PluginInfo) {
    if (!plugin.running || this.busy) return
    runInAction(() => {
      this.closingId = plugin.id
      this.error = ''
    })
    try {
      const ok = await this.postPlugin(plugin.id, 'close')
      if (ok) await this.refresh()
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.message || String(err)
      })
    } finally {
      runInAction(() => {
        this.closingId = null
      })
    }
  }

  dispose() {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }
}

export default new Store()
