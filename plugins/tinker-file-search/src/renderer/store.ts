import { makeAutoObservable, runInAction } from 'mobx'
import concat from 'licia/concat'
import debounce from 'licia/debounce'
import filter from 'licia/filter'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import trim from 'licia/trim'
import BaseStore from 'share/store/Base'
import { getFileIcon } from 'share/lib/util'
import type { FileResult } from './types'
import { createMcpApi } from './mcp'

const MAX_RESULTS = 100
const storage = new LocalStore('tinker-file-search')

const STORAGE_MOVE_TO_TRASH = 'moveToTrash'
const STORAGE_SHOW_PREVIEW = 'showPreview'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  query = ''
  results: FileResult[] = []
  searching = false
  hasMore = false
  iconCache: Map<string, string> = new Map()
  moveToTrash: boolean = storage.get(STORAGE_MOVE_TO_TRASH) !== false
  pendingDeletePath: string | null = null
  showPreview: boolean = storage.get(STORAGE_SHOW_PREVIEW) !== false
  selectedFile: FileResult | null = null

  private debounceSearch = debounce(() => this.search(), 300)
  private currentTask: tinker.SearchFileTask | null = null

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setQuery(query: string) {
    this.query = query
    this.debounceSearch()
  }

  private cancelCurrentTask() {
    if (this.currentTask) {
      this.currentTask.kill()
      this.currentTask = null
    }
  }

  private resetSearchState(results: FileResult[] = [], hasMore = false) {
    this.results = results
    this.hasMore = hasMore
    this.searching = false
    this.currentTask = null
  }

  async search() {
    const query = trim(this.query)
    if (isStrBlank(query)) {
      this.cancelCurrentTask()
      this.results = []
      this.hasMore = false
      return
    }

    this.cancelCurrentTask()
    this.searching = true

    const task = tinker.searchFile(query, {
      offset: 0,
      maxResults: MAX_RESULTS,
    })
    this.currentTask = task

    try {
      const results = await task
      runInAction(() => {
        this.resetSearchState(results, results.length >= MAX_RESULTS)
      })
    } catch {
      runInAction(() => {
        this.resetSearchState()
      })
    }
  }

  async loadMore() {
    const query = trim(this.query)
    if (isStrBlank(query) || this.searching || !this.hasMore) return

    this.cancelCurrentTask()
    this.searching = true

    const task = tinker.searchFile(query, {
      offset: this.results.length,
      maxResults: MAX_RESULTS,
    })
    this.currentTask = task

    try {
      const results = await task
      runInAction(() => {
        this.resetSearchState(
          concat(this.results, results),
          results.length >= MAX_RESULTS
        )
      })
    } catch {
      runInAction(() => {
        this.searching = false
        this.currentTask = null
      })
    }
  }

  async loadFileIcon(filePath: string) {
    if (this.iconCache.has(filePath)) return

    const icon = await getFileIcon(filePath)
    if (icon) {
      runInAction(() => {
        this.iconCache.set(filePath, icon)
      })
    }
  }

  setMoveToTrash(value: boolean) {
    this.moveToTrash = value
    storage.set(STORAGE_MOVE_TO_TRASH, value)
  }

  requestDelete(filePath: string) {
    this.pendingDeletePath = filePath
  }

  setShowPreview(value: boolean) {
    this.showPreview = value
    storage.set(STORAGE_SHOW_PREVIEW, value)
  }

  setSelectedFile(file: FileResult | null) {
    this.selectedFile = file
  }

  cancelDelete() {
    this.pendingDeletePath = null
  }

  async confirmDelete() {
    const filePath = this.pendingDeletePath
    if (!filePath) return false
    this.pendingDeletePath = null

    try {
      await fileSearch.deleteFile(filePath, this.moveToTrash)
      runInAction(() => {
        this.results = filter(this.results, (r) => r.path !== filePath)
      })
      return true
    } catch {
      return false
    }
  }
}

export default new Store()
