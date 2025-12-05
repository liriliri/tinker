import { IPlugin } from 'common/types'
import { action, makeObservable, observable, runInAction } from 'mobx'
import BaseStore from 'share/renderer/store/BaseStore'
import find from 'licia/find'

class Store extends BaseStore {
  plugins: IPlugin[] = []
  plugin: IPlugin | null = null
  filter = ''
  constructor() {
    super()

    makeObservable(this, {
      plugins: observable,
      filter: observable,
      plugin: observable,
      setFilter: action,
    })

    this.init()
  }
  setFilter(filter: string) {
    this.filter = filter
  }
  openPlugin(id: string) {
    const plugin = this.getPlugin(id)
    if (!plugin) {
      return
    }

    main.openPlugin(id).then((opened) => {
      if (opened) {
        runInAction(() => {
          this.plugin = plugin
          this.filter = plugin.name
        })
      }
    })
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
    this.plugin = null
  }
  detachPlugin() {
    if (!this.plugin) {
      return
    }
    main.detachPlugin(this.plugin.id)
    this.plugin = null
  }
  togglePluginDevtools() {
    if (!this.plugin) {
      return
    }
    main.togglePluginDevtools(this.plugin.id)
  }
  private getPlugin(id: string) {
    return find(this.plugins, (plugin) => plugin.id === id)
  }
  private async init() {
    const plugins = await main.getPlugins()
    runInAction(() => {
      this.plugins = plugins
    })
  }
}

export default new Store()
