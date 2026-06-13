import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import debounce from 'licia/debounce'
import LocalStore from 'licia/LocalStore'
import rtrim from 'licia/rtrim'
import sortBy from 'licia/sortBy'
import { fileExists } from './util'

export interface TextSearchFileGroup {
  path: string
  matches: tinker.SearchTextResult[]
}

export interface TextSearchActiveMatch {
  path: string
  lineNumber: number
  text: string
  submatches: tinker.SearchTextSubmatch[]
}

export interface TextSearchOptions {
  /**
   * Namespace for LocalStore persistence. Each plugin should pass a unique
   * value to avoid colliding with other plugins. Pass `undefined` to disable
   * persistence (state lives only in memory).
   */
  storageNamespace?: string
  /** Initial root directory; only used when persistence is disabled. */
  initialRootDir?: string
}

export interface TextSearchUIState {
  query: string
  rootDir: string
  includes: string
  excludes: string
  caseSensitive: boolean
  wholeWord: boolean
  regex: boolean
  maxResults: number
  groups: TextSearchFileGroup[]
  collapsed: Record<string, boolean>
  searching: boolean
  totalMatches: number
  totalFiles: number
  truncated: boolean
  activeMatchKey: string
}

export interface TextSearchUIActions {
  onQueryChange: (value: string) => void
  onIncludesChange: (value: string) => void
  onExcludesChange: (value: string) => void
  onCaseSensitiveChange: (value: boolean) => void
  onWholeWordChange: (value: boolean) => void
  onRegexChange: (value: boolean) => void
  onMaxResultsChange: (value: number) => void
  onActiveMatchKeyChange: (key: string) => void
  onClear: () => void
  onToggleCollapse: (path: string) => void
  onPickFolder: () => void
  onShowInFolder: (path: string) => void
  onCopyPath: (path: string) => void
}

export interface TextSearchSegment {
  text: string
  matched: boolean
}

const STORAGE_ROOT_DIR = 'rootDir'
const STORAGE_INCLUDES = 'includes'
const STORAGE_EXCLUDES = 'excludes'
const STORAGE_CASE_SENSITIVE = 'caseSensitive'
const STORAGE_WHOLE_WORD = 'wholeWord'
const STORAGE_REGEX = 'regex'
const STORAGE_MAX_RESULTS = 'maxResults'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/** Map a MobX `TextSearch` instance to plain UI props. Call inside an observer. */
export function getTextSearchUIProps(
  search: TextSearch
): TextSearchUIState & TextSearchUIActions {
  return {
    query: search.query,
    rootDir: search.rootDir,
    includes: search.includes,
    excludes: search.excludes,
    caseSensitive: search.caseSensitive,
    wholeWord: search.wholeWord,
    regex: search.regex,
    maxResults: search.maxResults,
    groups: search.groups,
    collapsed: Object.fromEntries(search.collapsed),
    searching: search.searching,
    totalMatches: search.totalMatches,
    totalFiles: search.totalFiles,
    truncated: search.truncated,
    activeMatchKey: search.activeMatchKey,
    onQueryChange: (value) => search.setQuery(value),
    onIncludesChange: (value) => search.setIncludes(value),
    onExcludesChange: (value) => search.setExcludes(value),
    onCaseSensitiveChange: (value) => search.setCaseSensitive(value),
    onWholeWordChange: (value) => search.setWholeWord(value),
    onRegexChange: (value) => search.setRegex(value),
    onMaxResultsChange: (value) => search.setMaxResults(value),
    onActiveMatchKeyChange: (key) => search.setActiveMatchKey(key),
    onClear: () => search.clear(),
    onToggleCollapse: (path) => search.toggleCollapse(path),
    onPickFolder: () => search.pickFolder(),
    onShowInFolder: (path) => search.showInFolder(path),
    onCopyPath: (path) => search.copyPath(path),
  }
}

/**
 * Split a line of text into segments using ripgrep submatches.
 * `start`/`end` are UTF-8 byte offsets within the line; we encode the line
 * to bytes, slice on byte boundaries, then decode back so multi-byte chars
 * (e.g. CJK) are not chopped.
 */
export function buildSegments(
  line: string,
  submatches: tinker.SearchTextSubmatch[]
): TextSearchSegment[] {
  const text = rtrim(line, ['\n', '\r'])
  if (!submatches || submatches.length === 0) {
    return [{ text, matched: false }]
  }

  const sorted = sortBy(submatches, (sm) => sm.start)
  const bytes = encoder.encode(text)
  const segments: TextSearchSegment[] = []
  let cursor = 0

  for (const sm of sorted) {
    const start = clamp(sm.start, 0, bytes.length)
    const end = clamp(sm.end, start, bytes.length)
    if (start > cursor) {
      segments.push({
        text: decoder.decode(bytes.slice(cursor, start)),
        matched: false,
      })
    }
    if (end > start) {
      segments.push({
        text: decoder.decode(bytes.slice(start, end)),
        matched: true,
      })
    }
    cursor = end
  }

  if (cursor < bytes.length) {
    segments.push({
      text: decoder.decode(bytes.slice(cursor)),
      matched: false,
    })
  }

  return segments
}

/**
 * Convert a (lineText, byteStart, byteEnd) triple to UTF-16 column offsets
 * (1-based, suitable for monaco-editor).
 */
export function byteRangeToColumns(
  lineText: string,
  byteStart: number,
  byteEnd: number
): { startColumn: number; endColumn: number } {
  const text = rtrim(lineText, ['\n', '\r'])
  const bytes = encoder.encode(text)
  const start = clamp(byteStart, 0, bytes.length)
  const end = clamp(byteEnd, start, bytes.length)

  const before = decoder.decode(bytes.slice(0, start))
  const matched = decoder.decode(bytes.slice(start, end))

  const startColumn = before.length + 1
  const endColumn = startColumn + matched.length
  return { startColumn, endColumn }
}

/** Extract a single 1-based line from a multi-line string. */
export function getLineText(content: string, lineNumber: number): string {
  if (!content || lineNumber < 1) return ''
  let start = 0
  for (let i = 1; i < lineNumber; i++) {
    const idx = content.indexOf('\n', start)
    if (idx === -1) return ''
    start = idx + 1
  }
  const end = content.indexOf('\n', start)
  return end === -1 ? content.slice(start) : content.slice(start, end)
}

/**
 * Reusable text search state + logic. Owns ripgrep task lifecycle, search
 * options, and the result list. Keeps no preview/title side effects so it can
 * be embedded in any host (text-search plugin, code-editor sidebar, etc.).
 */
export default class TextSearch {
  query: string = ''
  rootDir: string = ''
  includes: string = ''
  excludes: string = ''
  caseSensitive: boolean = false
  wholeWord: boolean = false
  regex: boolean = false
  maxResults: number = 1000

  groups: TextSearchFileGroup[] = []
  collapsed: Map<string, boolean> = new Map()
  searching: boolean = false
  totalMatches: number = 0
  totalFiles: number = 0
  truncated: boolean = false
  activeMatchKey: string = ''
  /**
   * `false` while the persisted rootDir is being verified on startup.
   * Becomes `true` once verification completes (whether the directory exists
   * or has been cleared because it was missing). Hosts that need to wait for
   * a confirmed rootDir (e.g. before setting the window title) should gate on
   * this flag.
   */
  restored: boolean = true

  private storage: LocalStore | null = null
  private groupIndex: Map<string, number> = new Map()
  private currentTask: tinker.SearchTextTask | null = null
  private debounceSearch = debounce(() => this.search(), 300)

  constructor(opts: TextSearchOptions = {}) {
    if (opts.storageNamespace) {
      const storage = new LocalStore(opts.storageNamespace)
      this.storage = storage
      this.rootDir = storage.get(STORAGE_ROOT_DIR) || ''
      this.includes = storage.get(STORAGE_INCLUDES) || ''
      this.excludes = storage.get(STORAGE_EXCLUDES) || ''
      this.caseSensitive = storage.get(STORAGE_CASE_SENSITIVE) === true
      this.wholeWord = storage.get(STORAGE_WHOLE_WORD) === true
      this.regex = storage.get(STORAGE_REGEX) === true
      this.maxResults = storage.get(STORAGE_MAX_RESULTS) || 1000
    } else if (opts.initialRootDir) {
      this.rootDir = opts.initialRootDir
    }

    const needsVerify = !!this.rootDir
    if (needsVerify) this.restored = false

    makeAutoObservable<
      this,
      'storage' | 'groupIndex' | 'currentTask' | 'debounceSearch'
    >(this, {
      storage: false,
      groupIndex: false,
      currentTask: false,
      debounceSearch: false,
    })

    if (needsVerify) this.verifyRootDir(this.rootDir)
  }

  private async verifyRootDir(dir: string) {
    const exists = await fileExists(dir)
    runInAction(() => {
      if (!exists && this.rootDir === dir) {
        this.rootDir = ''
        this.storage?.set(STORAGE_ROOT_DIR, '')
      }
      this.restored = true
    })
  }

  setQuery(value: string) {
    this.query = value
    this.debounceSearch()
  }

  setRootDir(value: string) {
    if (this.rootDir === value) return
    this.rootDir = value
    this.storage?.set(STORAGE_ROOT_DIR, value)
    this.debounceSearch()
  }

  setIncludes(value: string) {
    this.includes = value
    this.storage?.set(STORAGE_INCLUDES, value)
    this.debounceSearch()
  }

  setExcludes(value: string) {
    this.excludes = value
    this.storage?.set(STORAGE_EXCLUDES, value)
    this.debounceSearch()
  }

  setCaseSensitive(value: boolean) {
    this.caseSensitive = value
    this.storage?.set(STORAGE_CASE_SENSITIVE, value)
    this.debounceSearch()
  }

  setWholeWord(value: boolean) {
    this.wholeWord = value
    this.storage?.set(STORAGE_WHOLE_WORD, value)
    this.debounceSearch()
  }

  setRegex(value: boolean) {
    this.regex = value
    this.storage?.set(STORAGE_REGEX, value)
    this.debounceSearch()
  }

  setMaxResults(value: number) {
    this.maxResults = value
    this.storage?.set(STORAGE_MAX_RESULTS, value)
    this.debounceSearch()
  }

  setActiveMatchKey(key: string) {
    this.activeMatchKey = key
  }

  clear() {
    this.cancelTask()
    this.query = ''
    this.includes = ''
    this.excludes = ''
    this.storage?.set(STORAGE_INCLUDES, '')
    this.storage?.set(STORAGE_EXCLUDES, '')
    this.resetResults()
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

  showInFolder(path: string) {
    tinker.showItemInPath(path)
  }

  copyPath(path: string) {
    navigator.clipboard.writeText(path)
  }

  async search() {
    const trimmed = this.query.trim()
    this.cancelTask()
    this.resetResults()
    this.activeMatchKey = ''

    if (!trimmed || !this.rootDir) {
      this.searching = false
      return
    }

    this.searching = true

    const options: tinker.SearchTextOptions = {
      dirs: [this.rootDir],
      includes: this.includes,
      excludes: this.excludes,
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

  dispose() {
    this.cancelTask()
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
    this.collapsed.clear()
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
}
