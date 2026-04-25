import { IApp, IPlugin, IPluginStates } from 'common/types'
import { action, makeObservable, observable, runInAction } from 'mobx'
import BaseStore from 'share/renderer/store/BaseStore'
import find from 'licia/find'
import trim from 'licia/trim'
import isArr from 'licia/isArr'
import isObj from 'licia/isObj'
import LocalStore from 'licia/LocalStore'
import pkg from '../../../package.json'
import { sortByName, pinyinMatch, setMainStore } from './lib/util'

const storage = new LocalStore('main')
const STORAGE_KEY_PLUGINS = 'plugins'
const STORAGE_KEY_APPS = 'apps'

class Store extends BaseStore {
  plugins: IPlugin[] = []
  apps: IApp[] = []
  visiblePlugins: IPlugin[] = []
  visibleApps: IApp[] = []
  plugin: IPlugin | null = null
  filter = ''
  pluginStates: IPluginStates = {}
  constructor() {
    super()

    makeObservable(this, {
      visiblePlugins: observable,
      visibleApps: observable,
      filter: observable,
      plugin: observable,
      pluginStates: observable,
      setFilter: action,
      hidePlugin: action,
      unhidePlugin: action,
      pinPlugin: action,
      unpinPlugin: action,
    })

    this.loadCache()
    this.loadPluginStates()
    main.preparePluginView()
    this.refresh()
    this.bindEvent()
  }
  setFilter(filter: string) {
    this.filter = filter
    this.applyFilter()
  }
  openPlugin(id: string, detached = false) {
    const plugin = this.getPlugin(id)
    if (!plugin) {
      return
    }

    main.openPlugin(id, detached).then((opened) => {
      if (opened) {
        if (!detached) {
          runInAction(() => {
            this.plugin = plugin
          })
        } else {
          main.closeWin()
        }
      }
    })
  }
  openApp(path: string) {
    main.openApp(path)
    main.closeWin()
  }
  reopenPlugin() {
    if (!this.plugin) {
      return
    }
    main.reopenPlugin(this.plugin.id)
  }
  closePlugin() {
    if (!this.plugin) {
      return
    }
    main.closePlugin(this.plugin.id)
    preload.setTitle(pkg.productName)
    main.preparePluginView()
    this.plugin = null
    this.setFilter('')
  }
  detachPlugin() {
    if (!this.plugin) {
      return
    }
    main.detachPlugin(this.plugin.id).then(() => {
      this.plugin = null
      main.closeWin()
    })
  }
  togglePluginDevtools() {
    if (!this.plugin) {
      return
    }
    main.togglePluginDevtools(this.plugin.id)
  }
  hidePlugin(id: string) {
    this.pluginStates = {
      ...this.pluginStates,
      [id]: { ...this.pluginStates[id], hidden: true },
    }
    this.applyFilter()
    setMainStore('pluginStates', this.pluginStates)
  }
  unhidePlugin(id: string) {
    const state = { ...this.pluginStates[id] }
    delete state.hidden
    this.pluginStates = { ...this.pluginStates, [id]: state }
    this.applyFilter()
    setMainStore('pluginStates', this.pluginStates)
  }
  isPluginHidden(id: string) {
    return !!this.pluginStates[id]?.hidden
  }
  pinPlugin(id: string) {
    this.pluginStates = {
      ...this.pluginStates,
      [id]: { ...this.pluginStates[id], pinned: true },
    }
    this.applyFilter()
    setMainStore('pluginStates', this.pluginStates)
  }
  unpinPlugin(id: string) {
    const state = { ...this.pluginStates[id] }
    delete state.pinned
    this.pluginStates = { ...this.pluginStates, [id]: state }
    this.applyFilter()
    setMainStore('pluginStates', this.pluginStates)
  }
  isPluginPinned(id: string) {
    return !!this.pluginStates[id]?.pinned
  }
  async refresh(force = false) {
    const searchLocalApps = await main.getSettingsStore('searchLocalApps')
    const [plugins, apps] = await Promise.all([
      main.getPlugins(force),
      searchLocalApps !== false ? main.getApps(force) : [],
    ])
    runInAction(() => {
      this.plugins = sortByName(plugins)
      this.apps = sortByName(apps)
      this.applyFilter()
    })
    this.saveCache()
  }
  private getPlugin(id: string) {
    return find(this.plugins, (plugin) => plugin.id === id)
  }
  private applyFilter() {
    const filter = trim(this.filter)
    if (!filter) {
      const filtered = this.plugins.filter(
        (plugin) => !this.pluginStates[plugin.id]?.hidden
      )
      const pinned = filtered.filter(
        (plugin) => this.pluginStates[plugin.id]?.pinned
      )
      const unpinned = filtered.filter(
        (plugin) => !this.pluginStates[plugin.id]?.pinned
      )
      this.visiblePlugins = [...pinned, ...unpinned]
      this.visibleApps = this.apps
      return
    }

    const matched = this.plugins.filter((plugin) =>
      pinyinMatch(plugin.name, filter)
    )
    const pinned = matched.filter(
      (plugin) => this.pluginStates[plugin.id]?.pinned
    )
    const unpinned = matched.filter(
      (plugin) => !this.pluginStates[plugin.id]?.pinned
    )
    this.visiblePlugins = [...pinned, ...unpinned]
    this.visibleApps = this.apps.filter((app) => pinyinMatch(app.name, filter))
  }
  private async loadPluginStates() {
    const plugins = await main.getMainStore('pluginStates')
    if (isObj(plugins)) {
      runInAction(() => {
        this.pluginStates = plugins
        this.applyFilter()
      })
    }
  }
  private bindEvent() {
    main.on('updatePluginTitle', (title: string) => {
      if (this.plugin) {
        runInAction(() => (this.filter = title))
      }
    })
    main.on('closePlugin', () => {
      this.closePlugin()
    })
  }
  private loadCache() {
    const plugins = storage.get(STORAGE_KEY_PLUGINS)
    const apps = storage.get(STORAGE_KEY_APPS)
    if (!isArr(plugins) || !isArr(apps)) {
      return
    }
    runInAction(() => {
      this.plugins = sortByName(plugins)
      this.apps = sortByName(apps)
      this.applyFilter()
    })
  }
  private saveCache() {
    storage.set({
      [STORAGE_KEY_PLUGINS]: this.plugins,
      [STORAGE_KEY_APPS]: this.apps,
    })
  }
}

export default new Store()
