import { makeAutoObservable, runInAction } from 'mobx'
import toast from 'react-hot-toast'
import i18n from 'i18next'
import BaseStore from 'share/store/Base'
import type { WebApp, WebAppInput } from '../common/types'

class Store extends BaseStore {
  apps: WebApp[] = []
  loading = false
  saving = false
  dialogOpen = false
  editing: WebApp | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    void this.load()
  }

  async load() {
    this.loading = true
    try {
      const apps = await webapp.list()
      runInAction(() => {
        this.apps = apps
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  openCreate() {
    this.editing = null
    this.dialogOpen = true
  }

  openEdit(app: WebApp) {
    this.editing = app
    this.dialogOpen = true
  }

  closeDialog() {
    this.dialogOpen = false
    this.editing = null
  }

  async save(input: WebAppInput) {
    this.saving = true
    try {
      if (this.editing) {
        await webapp.update(this.editing.id, input)
      } else {
        await webapp.create(input)
      }
      await this.load()
      runInAction(() => {
        this.dialogOpen = false
        this.editing = null
      })
      toast.success(i18n.t('saved'))
    } finally {
      runInAction(() => {
        this.saving = false
      })
    }
  }

  async remove(app: WebApp) {
    await webapp.remove(app.id)
    await this.load()
  }

  async open(app: WebApp) {
    if (!(await tinker.hasPlugin(app.id))) {
      toast.error(i18n.t('pluginNotFound'))
      return
    }
    await tinker.openPlugin(app.id)
  }
}

export default new Store()
