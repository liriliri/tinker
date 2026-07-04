import { makeAutoObservable, reaction, runInAction } from 'mobx'
import splitPath from 'licia/splitPath'
import BaseStore from 'share/store/Base'
import TextSearch, { type TextSearchActiveMatch } from 'share/lib/textSearch'

class Store extends BaseStore {
  search = new TextSearch({ storageNamespace: 'tinker-text-search' })

  activeMatch: TextSearchActiveMatch | null = null

  previewContent: string = ''
  previewPath: string = ''
  previewLoading: boolean = false
  previewError: string = ''

  private previewToken: number = 0

  constructor() {
    super()
    makeAutoObservable(this, { search: false })
    reaction(
      () => (this.search.restored ? this.search.rootDir : null),
      (rootDir) => {
        if (rootDir !== null) this.updateTitle(rootDir)
      },
      { fireImmediately: true }
    )
  }

  selectMatch = (match: TextSearchActiveMatch) => {
    this.activeMatch = match
    this.loadPreview(match.path)
  }

  private updateTitle(rootDir: string) {
    const title = rootDir ? splitPath(rootDir).name || rootDir : ''
    tinker.setTitle(title)
  }

  private async loadPreview(path: string) {
    if (path === this.previewPath && !this.previewError) return
    const token = ++this.previewToken
    this.previewLoading = true
    this.previewError = ''
    try {
      const content = (await tinker.readFile(path, 'utf-8')) as string
      if (token !== this.previewToken) return
      runInAction(() => {
        this.previewContent = content
        this.previewPath = path
        this.previewLoading = false
      })
    } catch (err) {
      if (token !== this.previewToken) return
      runInAction(() => {
        this.previewContent = ''
        this.previewPath = path
        this.previewLoading = false
        this.previewError = (err as Error)?.message || 'Failed to read file'
      })
    }
  }
}

export default new Store()
