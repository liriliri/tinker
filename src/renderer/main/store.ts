import { IApp, IPlugin } from 'common/types'
import { action, makeObservable, observable, runInAction } from 'mobx'
import BaseStore from 'share/renderer/store/BaseStore'
import find from 'licia/find'
import lowerCase from 'licia/lowerCase'
import trim from 'licia/trim'
import PinyinMatch from 'pinyin-match'
import toBool from 'licia/toBool'
import pkg from '../../../package.json'

class Store extends BaseStore {
  plugins: IPlugin[] = []
  apps: IApp[] = []
  visiblePlugins: IPlugin[] = []
  visibleApps: IApp[] = []
  plugin: IPlugin | null = null
  filter = ''
  constructor() {
    super()

    makeObservable(this, {
      visiblePlugins: observable,
      visibleApps: observable,
      filter: observable,
      plugin: observable,
      setFilter: action,
    })

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
  async refresh(force = false) {
    const plugins = await main.getPlugins(force)
    runInAction(() => {
      this.plugins = plugins
      this.applyFilter()
    })
    const apps = await main.getApps(force)
    runInAction(() => {
      this.apps = apps
      this.applyFilter()
    })
  }
  private getPlugin(id: string) {
    return find(this.plugins, (plugin) => plugin.id === id)
  }
  private applyFilter() {
    const filter = lowerCase(trim(this.filter))
    if (!filter) {
      this.visiblePlugins = this.plugins
      this.visibleApps = this.apps
      return
    }

    this.visiblePlugins = this.plugins.filter((plugin) => {
      const name = lowerCase(plugin.name)
      return toBool(PinyinMatch.match(name, filter))
    })
    this.visibleApps = this.apps.filter((app) => {
      const name = lowerCase(app.name)
      return toBool(PinyinMatch.match(name, filter))
    })
  }
  private bindEvent() {
    main.on('updatePluginTitle', (title: string) => {
      if (this.plugin) {
        runInAction(() => (this.filter = title))
      }
    })
  }
}

export default new Store()
