import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import splitPath from 'licia/splitPath'
import normalizePath from 'licia/normalizePath'
import { relativePath } from '../lib/path'
import type { QuickOpenItem } from '../types'

const MAX_RESULTS = 50
const SEARCH_DELAY = 200

interface QuickOpenOptions {
  getRootPath: () => string
  getOpenTabPaths: () => string[]
  onOpenFile: (filePath: string, fileName: string) => Promise<string | null>
}

class QuickOpen {
  open = false
  query = ''
  results: tinker.SearchFileResult[] = []
  searching = false
  selectedIndex = 0

  private searchTask: tinker.SearchFileTask | null = null
  private getRootPath: () => string
  private getOpenTabPaths: () => string[]
  private onOpenFile: (
    filePath: string,
    fileName: string
  ) => Promise<string | null>
  private debouncedSearch = debounce(() => void this.search(), SEARCH_DELAY)

  constructor(options: QuickOpenOptions) {
    this.getRootPath = options.getRootPath
    this.getOpenTabPaths = options.getOpenTabPaths
    this.onOpenFile = options.onOpenFile
    makeAutoObservable(this)
  }

  get items(): QuickOpenItem[] {
    const rootPath = this.getRootPath()
    if (!rootPath) return []

    const trimmed = this.query.trim()
    if (!trimmed) {
      return this.getOpenTabPaths().map((path) => this.toItem(path, rootPath))
    }

    return this.results
      .filter((result) =>
        normalizePath(result.path).startsWith(normalizePath(rootPath))
      )
      .map((result) => this.toItem(result.path, rootPath))
  }

  show() {
    if (!this.getRootPath()) return

    this.open = true
    this.query = ''
    this.results = []
    this.searching = false
    this.selectedIndex = 0
    this.cancelSearch()
  }

  hide() {
    this.open = false
    this.query = ''
    this.results = []
    this.searching = false
    this.selectedIndex = 0
    this.cancelSearch()
  }

  setQuery(query: string) {
    this.query = query
    this.selectedIndex = 0
    this.debouncedSearch()
  }

  moveSelection(delta: number) {
    const count = this.items.length
    if (count === 0) return

    this.selectedIndex = (this.selectedIndex + delta + count) % count
  }

  async acceptSelected() {
    const item = this.items[this.selectedIndex]
    if (!item) return

    await this.onOpenFile(item.path, item.name)
    this.hide()
  }

  selectIndex(index: number) {
    if (index < 0 || index >= this.items.length) return
    this.selectedIndex = index
  }

  private toItem(path: string, rootPath: string): QuickOpenItem {
    const { name } = splitPath(path)
    return {
      path,
      name,
      relativePath: relativePath(rootPath, path),
    }
  }

  private cancelSearch() {
    if (this.searchTask) {
      this.searchTask.kill()
      this.searchTask = null
    }
  }

  private async search() {
    const query = this.query.trim()
    const rootPath = this.getRootPath()

    if (!query || !rootPath) {
      this.cancelSearch()
      runInAction(() => {
        this.results = []
        this.searching = false
      })
      return
    }

    this.cancelSearch()
    runInAction(() => {
      this.searching = true
    })

    const task = tinker.searchFile(query, {
      dirs: [rootPath],
      maxResults: MAX_RESULTS,
    })
    this.searchTask = task

    try {
      const results = await task
      runInAction(() => {
        if (this.searchTask === task) {
          this.results = results
          this.searching = false
          this.searchTask = null
          if (this.selectedIndex >= this.items.length) {
            this.selectedIndex = Math.max(0, this.items.length - 1)
          }
        }
      })
    } catch {
      runInAction(() => {
        if (this.searchTask === task) {
          this.results = []
          this.searching = false
          this.searchTask = null
        }
      })
    }
  }
}

export default QuickOpen
