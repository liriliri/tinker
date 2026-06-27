import { makeAutoObservable } from 'mobx'
import last from 'licia/last'
import pluck from 'licia/pluck'
import type { IFileEntry, SortMethod, SortOrder } from '../../common/types'
import { filterEntries, sortEntries } from '../lib/util'

class Explorer {
  id: string
  title: string
  path: string
  entries: IFileEntry[] = []
  loading = false
  error: string | null = null
  selectedPaths: string[] = []
  selectionAnchorIndex = -1
  history: string[] = []
  historyIndex = -1
  sortMethod: SortMethod = 'name'
  sortOrder: SortOrder = 'asc'
  filterText = ''
  showHiddenFiles = false

  constructor(id: string, path: string, title?: string) {
    this.id = id
    this.path = path
    this.title = title || last(path.split('/')) || path
    makeAutoObservable(this)
  }

  get sortedEntries(): IFileEntry[] {
    return sortEntries(this.entries, this.sortMethod, this.sortOrder)
  }

  get visibleEntries(): IFileEntry[] {
    return filterEntries(
      this.sortedEntries,
      this.filterText,
      this.showHiddenFiles
    )
  }

  get listableEntries(): IFileEntry[] {
    return filterEntries(this.sortedEntries, '', this.showHiddenFiles)
  }

  get isFiltering(): boolean {
    return this.filterText.trim().length > 0
  }

  get canGoBack(): boolean {
    return this.historyIndex > 0
  }

  get canGoForward(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  get canGoUp(): boolean {
    const parent = fileExplorer.dirname(this.path)
    return parent !== this.path
  }

  get previewPath(): string | null {
    for (let i = this.selectedPaths.length - 1; i >= 0; i--) {
      const path = this.selectedPaths[i]
      const entry = this.entries.find((item) => item.path === path)
      if (entry && !entry.isDirectory) {
        return path
      }
    }
    return null
  }

  setFilterText(text: string) {
    this.filterText = text
  }

  clearFilter() {
    this.filterText = ''
  }

  setSort(method: SortMethod, order?: SortOrder) {
    if (this.sortMethod === method && order === undefined) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      return
    }
    this.sortMethod = method
    if (order) {
      this.sortOrder = order
    }
  }

  setSelectedPaths(paths: string[]) {
    this.selectedPaths = paths
  }

  toggleSelection(path: string) {
    if (this.selectedPaths.includes(path)) {
      this.selectedPaths = this.selectedPaths.filter((p) => p !== path)
    } else {
      this.selectedPaths = [...this.selectedPaths, path]
    }
  }

  selectSingle(path: string, anchorIndex?: number) {
    this.selectedPaths = [path]
    if (anchorIndex !== undefined) {
      this.selectionAnchorIndex = anchorIndex
    }
  }

  selectRange(startIndex: number, endIndex: number) {
    const from = Math.min(startIndex, endIndex)
    const to = Math.max(startIndex, endIndex)
    this.selectedPaths = pluck(this.visibleEntries.slice(from, to + 1), 'path')
  }

  selectAll() {
    this.selectedPaths = pluck(this.visibleEntries, 'path')
  }

  handleRowSelect(
    index: number,
    path: string,
    { shift, ctrlOrMeta }: { shift: boolean; ctrlOrMeta: boolean }
  ) {
    if (shift && this.selectionAnchorIndex >= 0) {
      this.selectRange(this.selectionAnchorIndex, index)
      return
    }

    if (ctrlOrMeta) {
      this.toggleSelection(path)
      this.selectionAnchorIndex = index
      return
    }

    this.selectSingle(path, index)
  }

  clearSelection() {
    this.selectedPaths = []
    this.selectionAnchorIndex = -1
  }

  pushHistory(path: string) {
    if (this.history[this.historyIndex] === path) return

    const next = this.history.slice(0, this.historyIndex + 1)
    next.push(path)
    this.history = next
    this.historyIndex = next.length - 1
  }

  goBack(): string | null {
    if (!this.canGoBack) return null
    this.historyIndex--
    return this.history[this.historyIndex]
  }

  goForward(): string | null {
    if (!this.canGoForward) return null
    this.historyIndex++
    return this.history[this.historyIndex]
  }
}

export default Explorer
