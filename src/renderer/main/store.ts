import { IPlugin } from 'common/types'
import { makeObservable, observable, runInAction } from 'mobx'
import BaseStore from 'share/renderer/store/BaseStore'

class Store extends BaseStore {
  plugins: IPlugin[] = []
  constructor() {
    super()

    makeObservable(this, {
      plugins: observable,
    })

    this.init()
  }
  private async init() {
    const plugins = await main.getPlugins()
    console.log(plugins)
    runInAction(() => {
      this.plugins = plugins
    })
  }
}

export default new Store()
