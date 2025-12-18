import { IPlugin } from 'common/types'
import { action, makeObservable, observable, runInAction } from 'mobx'
import BaseStore from 'share/renderer/store/BaseStore'
import find from 'licia/find'
import lowerCase from 'licia/lowerCase'
import trim from 'licia/trim'
import PinyinMatch from 'pinyin-match'
import toBool from 'licia/toBool'

class Store extends BaseStore {
  plugins: IPlugin[] = []
  visiblePlugins: IPlugin[] = []
  plugin: IPlugin | null = null
  filter = ''
  constructor() {
    super()

    makeObservable(this, {
      plugins: observable,
      visiblePlugins: observable,
      filter: observable,
      plugin: observable,
      setFilter: action,
    })

    this.init()
  }
  setFilter(filter: string) {
    this.filter = filter
    this.filterPlugins()
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
            this.filter = plugin.name
          })
        } else {
          main.closeWin()
        }
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
  private getPlugin(id: string) {
    return find(this.plugins, (plugin) => plugin.id === id)
  }
  private filterPlugins() {
    const filter = lowerCase(trim(this.filter))
    if (!filter) {
      this.visiblePlugins = this.plugins
      return
    }

    this.visiblePlugins = this.plugins.filter((plugin) => {
      const name = lowerCase(plugin.name)
      return toBool(PinyinMatch.match(name, filter))
    })
  }
  private async init() {
    const plugins = await main.getPlugins()
    runInAction(() => {
      this.plugins = plugins
      this.filterPlugins()
    })
  }
}

export default new Store()
