import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import BaseStore from 'share/BaseStore'
import type { ActiveMatch, FileGroup } from './types'

const storage = new LocalStore('tinker-text-search')

const STORAGE_ROOT_DIR = 'rootDir'
const STORAGE_INCLUDES = 'includes'
const STORAGE_EXCLUDES = 'excludes'
const STORAGE_CASE_SENSITIVE = 'caseSensitive'
const STORAGE_WHOLE_WORD = 'wholeWord'
const STORAGE_REGEX = 'regex'
const STORAGE_MAX_RESULTS = 'maxResults'
const STORAGE_SHOW_INCLUDE = 'showInclude'

class Store extends BaseStore {
  query: string = ''
  rootDir: string = storage.get(STORAGE_ROOT_DIR) || ''
  includes: string = storage.get(STORAGE_INCLUDES) || ''
  excludes: string = storage.get(STORAGE_EXCLUDES) || ''
  caseSensitive: boolean = storage.get(STORAGE_CASE_SENSITIVE) === true
  wholeWord: boolean = storage.get(STORAGE_WHOLE_WORD) === true
  regex: boolean = storage.get(STORAGE_REGEX) === true
  maxResults: number = storage.get(STORAGE_MAX_RESULTS) || 1000
  showInclude: boolean = storage.get(STORAGE_SHOW_INCLUDE) === true

  groups: FileGroup[] = []
  collapsed: Map<string, boolean> = new Map()
  searching: boolean = false
  totalMatches: number = 0
  totalFiles: number = 0
  truncated: boolean = false

  activeMatch: ActiveMatch | null = null
  activeMatchKey: string = ''

  previewContent: string = ''
  previewPath: string = ''
  previewLoading: boolean = false
  previewError: string = ''

  private groupIndex: Map<string, number> = new Map()
  private currentTask: tinker.SearchTextTask | null = null
  private debounceSearch = debounce(() => this.search(), 300)
  private previewToken: number = 0

  constructor() {
    super()
    makeAutoObservable(this)
    setTimeout(() => this.updateTitle(), 0)
  }

  private updateTitle() {
    if (this.rootDir) {
      const name = splitPath(this.rootDir).name || this.rootDir
      tinker.setTitle(name)
    } else {
      tinker.setTitle('')
    }
  }

  setQuery(value: string) {
    this.query = value
    this.debounceSearch()
  }

  setRootDir(value: string) {
    this.rootDir = value
    storage.set(STORAGE_ROOT_DIR, value)
    this.updateTitle()
    this.debounceSearch()
  }

  setIncludes(value: string) {
    this.includes = value
    storage.set(STORAGE_INCLUDES, value)
    this.debounceSearch()
  }

  setExcludes(value: string) {
    this.excludes = value
    storage.set(STORAGE_EXCLUDES, value)
    this.debounceSearch()
  }

  setCaseSensitive(value: boolean) {
    this.caseSensitive = value
    storage.set(STORAGE_CASE_SENSITIVE, value)
    this.debounceSearch()
  }

  setWholeWord(value: boolean) {
    this.wholeWord = value
    storage.set(STORAGE_WHOLE_WORD, value)
    this.debounceSearch()
  }

  setRegex(value: boolean) {
    this.regex = value
    storage.set(STORAGE_REGEX, value)
    this.debounceSearch()
  }

  setMaxResults(value: number) {
    this.maxResults = value
    storage.set(STORAGE_MAX_RESULTS, value)
    this.debounceSearch()
  }

  setShowInclude(value: boolean) {
    this.showInclude = value
    storage.set(STORAGE_SHOW_INCLUDE, value)
  }

  clear() {
    this.cancelTask()
    this.query = ''
    this.includes = ''
    this.excludes = ''
    storage.set(STORAGE_INCLUDES, '')
    storage.set(STORAGE_EXCLUDES, '')
    this.resetResults()
    this.activeMatch = null
    this.activeMatchKey = ''
    this.searching = false
  }

  toggleCollapse(path: string) {
    this.collapsed.set(path, !this.collapsed.get(path))
  }

  isCollapsed(path: string): boolean {
    return this.collapsed.get(path) === true
  }

  async pickFolder() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    const dir = result.filePaths[0]
    if (result.canceled || !dir) return
    this.setRootDir(dir)
  }

  selectMatch(match: ActiveMatch) {
    this.activeMatch = match
    this.activeMatchKey = `${match.path}:${match.lineNumber}`
    this.loadPreview(match.path)
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

  private cancelTask() {
    if (this.currentTask) {
      try {
        this.currentTask.kill()
      } catch {
        // ignore
      }
      this.currentTask = null
    }
  }

  private resetResults() {
    this.groups = []
    this.groupIndex = new Map()
    this.totalMatches = 0
    this.totalFiles = 0
    this.truncated = false
  }

  private addMatch(m: tinker.SearchTextResult) {
    const idx = this.groupIndex.get(m.path)
    if (idx === undefined) {
      this.groupIndex.set(m.path, this.groups.length)
      this.groups.push({ path: m.path, matches: [m] })
      this.totalFiles++
    } else {
      this.groups[idx].matches.push(m)
    }
    this.totalMatches++
  }

  private buildGlobs(): string[] {
    const parse = (s: string) =>
      s
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    return [
      ...parse(this.includes),
      ...parse(this.excludes).map((g) => '!' + g),
    ]
  }

  async search() {
    const trimmed = this.query.trim()
    this.cancelTask()
    this.resetResults()
    this.activeMatch = null
    this.activeMatchKey = ''

    if (!trimmed || !this.rootDir) {
      this.searching = false
      return
    }

    this.searching = true

    const options: tinker.SearchTextOptions = {
      dirs: [this.rootDir],
      globs: this.buildGlobs(),
      caseSensitive: this.caseSensitive,
      wholeWord: this.wholeWord,
      regex: this.regex,
      maxResults: this.maxResults,
    }

    const task = tinker.searchText(trimmed, options, (m) => {
      runInAction(() => {
        this.addMatch(m)
      })
    })
    this.currentTask = task

    try {
      await task
    } catch {
      // ignore
    }

    runInAction(() => {
      this.searching = false
      this.truncated = this.totalMatches >= this.maxResults
      this.currentTask = null
    })
  }

  showInFolder(path: string) {
    tinker.showItemInPath(path)
  }

  copyPath(path: string) {
    navigator.clipboard.writeText(path)
  }
}

export default new Store()
