import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  constructor() {
    super()
    makeAutoObservable(this)
  }
}

const store = new Store()

export default store
