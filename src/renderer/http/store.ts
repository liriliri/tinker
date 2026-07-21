import { action, makeObservable, observable, runInAction } from 'mobx'
import { t } from 'common/util'
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
}

function pluginIdFromPath() {
  const match = location.pathname.match(/^\/p\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : null
}

class Store {
  plugins: PluginInfo[] = []
  error = ''
  pluginId: string | null = pluginIdFromPath()

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
      error: observable,
      pluginId: observable,
      authRequired: observable,
      authenticated: observable,
      authError: observable,
      authReady: observable,
      credentials: observable,
      statusKey: observable,
      screencastErrorKey: observable,
      screencastErrorRaw: observable,
      screencastActive: observable,
      setStatusKey: action,
      setScreencastErrorKey: action,
      setScreencastErrorRaw: action,
      setScreencastActive: action,
      resetScreencast: action,
    })

    void this.initAuth()
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

  async refresh() {
    if (this.authRequired && !this.authenticated) {
      return
    }
    try {
      const res = await apiFetch('/api/plugins', {}, this.credentials)
      if (res.status === 401) {
        clearCredentials()
        runInAction(() => {
          this.credentials = null
          this.authenticated = false
          this.authError = t('loginErr')
        })
        if (this.pluginId) {
          location.replace('/')
        }
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

  dispose() {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }
}

export default new Store()
