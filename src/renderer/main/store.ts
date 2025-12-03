import { IPlugin } from 'common/types'
import { action, makeObservable, observable, runInAction } from 'mobx'
import BaseStore from 'share/renderer/store/BaseStore'

class Store extends BaseStore {
  plugins: IPlugin[] = []
  filter = ''
  constructor() {
    super()

    makeObservable(this, {
      plugins: observable,
      filter: observable,
      setFilter: action,
    })

    this.init()
  }
  setFilter(filter: string) {
    this.filter = filter
  }
  private async init() {
    const plugins = await main.getPlugins()
    runInAction(() => {
      this.plugins = plugins
    })
  }
}

export default new Store()
