import { makeAutoObservable, reaction, runInAction } from 'mobx'
import splitPath from 'licia/splitPath'
import BaseStore from 'share/BaseStore'
import TextSearch, { type TextSearchActiveMatch } from 'share/lib/TextSearch'

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
    this.updateTitle()
    reaction(
      () => this.search.rootDir,
      () => this.updateTitle()
    )
  }

  selectMatch = (match: TextSearchActiveMatch) => {
    this.activeMatch = match
    this.loadPreview(match.path)
  }

  private updateTitle() {
    const rootDir = this.search.rootDir
    if (rootDir) {
      const name = splitPath(rootDir).name || rootDir
      tinker.setTitle(name)
    } else {
      tinker.setTitle('')
    }
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
