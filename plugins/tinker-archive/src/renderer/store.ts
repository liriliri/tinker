import { makeAutoObservable, reaction, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import pluck from 'licia/pluck'
import splitPath from 'licia/splitPath'
import isEmpty from 'licia/isEmpty'
import isStrBlank from 'licia/isStrBlank'
import contain from 'licia/contain'
import filter from 'licia/filter'
import concat from 'licia/concat'
import some from 'licia/some'
import trim from 'licia/trim'
import lowerCase from 'licia/lowerCase'
import endWith from 'licia/endWith'
import toast from 'react-hot-toast'
import i18n from 'i18next'
import BaseStore from 'share/store/Base'
import type {
  IArchiveEntry,
  SortMethod,
  SortOrder,
  ViewMode,
} from '../common/types'
import {
  buildPathBreadcrumbs,
  filterEntries,
  joinZipPath,
  sortEntries,
} from './lib/util'

const storage = new LocalStore('tinker-archive')
const STORAGE_VIEW_MODE = 'viewMode'

export class Store extends BaseStore {
  archivePath: string | null = null
  currentPath = ''
  entries: IArchiveEntry[] = []
  loading = false
  error: string | null = null
  selectedPaths: string[] = []
  selectionAnchorIndex = -1
  history: string[] = []
  historyIndex = -1
  sortMethod: SortMethod = 'name'
  sortOrder: SortOrder = 'asc'
  filterText = ''
  viewMode: ViewMode = 'list'
  pathInput = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
    this.bindEvent()
  }

  private loadStorage() {
    const savedViewMode = storage.get(STORAGE_VIEW_MODE)
    if (savedViewMode === 'list' || savedViewMode === 'grid') {
      this.viewMode = savedViewMode
    }
  }

  private bindEvent() {
    reaction(
      () => this.archiveName,
      (name) => {
        tinker.setTitle(name || '')
      }
    )
  }

  get archiveName(): string {
    if (!this.archivePath) return ''
    return splitPath(this.archivePath).name || this.archivePath
  }

  get isOpen(): boolean {
    return !!this.archivePath
  }

  get sortedEntries(): IArchiveEntry[] {
    return sortEntries(this.entries, this.sortMethod, this.sortOrder)
  }

  get visibleEntries(): IArchiveEntry[] {
    return filterEntries(this.sortedEntries, this.filterText)
  }

  get isFiltering(): boolean {
    return !isStrBlank(this.filterText)
  }

  get canGoBack(): boolean {
    return this.historyIndex > 0
  }

  get canGoForward(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  get canGoUp(): boolean {
    return this.currentPath !== ''
  }

  get pathItems() {
    return buildPathBreadcrumbs(
      this.archiveName || 'archive.zip',
      this.currentPath
    )
  }

  get selectedCount(): number {
    return this.selectedPaths.length
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode
    storage.set(STORAGE_VIEW_MODE, mode)
  }

  setFilterText(text: string) {
    this.filterText = text
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

  setPathInput(value: string) {
    this.pathInput = value
  }

  toggleSelection(path: string) {
    if (contain(this.selectedPaths, path)) {
      this.selectedPaths = filter(this.selectedPaths, (item) => item !== path)
    } else {
      this.selectedPaths = concat(this.selectedPaths, [path])
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

  private pushHistory(path: string) {
    if (this.history[this.historyIndex] === path) return
    const next = this.history.slice(0, this.historyIndex + 1)
    next.push(path)
    this.history = next
    this.historyIndex = next.length - 1
  }

  private showError(key: string) {
    toast.error(i18n.t(key))
  }

  private async loadEntries(dirPath: string, push = true) {
    this.loading = true
    this.error = null
    try {
      const entries = archive.listDir(dirPath)
      runInAction(() => {
        this.currentPath = dirPath
        this.entries = entries
        this.clearSelection()
        this.pathInput = dirPath
        if (push) {
          this.pushHistory(dirPath)
        }
      })
    } catch {
      runInAction(() => {
        this.error = i18n.t('errorListDir')
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  private async openArchivePath(filePath: string) {
    this.loading = true
    this.error = null
    try {
      archive.open(filePath)
      runInAction(() => {
        this.archivePath = filePath
        this.history = []
        this.historyIndex = -1
        this.filterText = ''
      })
      await this.loadEntries('', true)
    } catch {
      archive.close()
      runInAction(() => {
        this.archivePath = null
        this.entries = []
      })
      this.showError('errorOpenArchive')
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async openArchive() {
    const result = await tinker.showOpenDialog({
      filters: [{ name: 'ZIP', extensions: ['zip'] }],
      properties: ['openFile'],
    })
    if (result.canceled || isEmpty(result.filePaths)) return
    await this.openArchivePath(result.filePaths[0])
  }

  async openArchiveFromFile(file: File) {
    const filePath = tinker.getPathForFile(file)
    if (!filePath) {
      this.showError('errorGetFilePath')
      return
    }
    if (!endWith(lowerCase(filePath), '.zip')) {
      this.showError('errorUnsupportedFormat')
      return
    }
    await this.openArchivePath(filePath)
  }

  async createArchive() {
    const result = await tinker.showSaveDialog({
      defaultPath: 'archive.zip',
      filters: [{ name: 'ZIP', extensions: ['zip'] }],
    })
    if (result.canceled || !result.filePath) return

    let filePath = result.filePath
    if (!endWith(lowerCase(filePath), '.zip')) {
      filePath = `${filePath}.zip`
    }

    this.loading = true
    try {
      archive.create(filePath)
      runInAction(() => {
        this.archivePath = filePath
        this.history = []
        this.historyIndex = -1
        this.filterText = ''
      })
      await this.loadEntries('', true)
      toast.success(i18n.t('createSuccess'))
    } catch {
      archive.close()
      runInAction(() => {
        this.archivePath = null
        this.entries = []
      })
      this.showError('errorCreateArchive')
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async refresh() {
    if (!this.isOpen) return
    await this.loadEntries(this.currentPath, false)
  }

  async navigate(dirPath: string) {
    if (!this.isOpen) return
    await this.loadEntries(dirPath, true)
  }

  async goBack() {
    if (!this.canGoBack) return
    this.historyIndex--
    await this.loadEntries(this.history[this.historyIndex], false)
  }

  async goForward() {
    if (!this.canGoForward) return
    this.historyIndex++
    await this.loadEntries(this.history[this.historyIndex], false)
  }

  async goUp() {
    if (!this.canGoUp) return
    await this.navigate(archive.dirname(this.currentPath))
  }

  async submitPathInput() {
    const value = trim(this.pathInput)
    if (!value || value === '/') {
      await this.navigate('')
      return
    }

    const normalized = endWith(value, '/') ? value : `${value}/`
    const parent = archive.dirname(normalized)
    const siblings = archive.listDir(parent)
    const found = some(
      siblings,
      (entry) => entry.isDirectory && entry.path === normalized
    )
    if (!found && !archive.entryExists(normalized)) {
      this.showError('errorPathNotFound')
      this.pathInput = this.currentPath
      return
    }

    await this.navigate(normalized)
  }

  async activateEntry(entryPath: string, isDirectory: boolean) {
    if (isDirectory) {
      await this.navigate(entryPath)
    }
  }

  async addFiles(filePaths?: string[]) {
    if (!this.isOpen) return

    let paths = filePaths
    if (!paths) {
      const result = await tinker.showOpenDialog({
        properties: ['openFile', 'openDirectory', 'multiSelections'],
      })
      if (result.canceled || isEmpty(result.filePaths)) return
      paths = result.filePaths
    }

    try {
      archive.addFiles(paths, this.currentPath)
      await this.refresh()
      toast.success(i18n.t('addSuccess'))
    } catch {
      this.showError('errorAddFiles')
    }
  }

  async createFolder(name: string) {
    if (!this.isOpen || isStrBlank(name)) return

    const folderPath = joinZipPath(this.currentPath, trim(name))
    const entryPath = endWith(folderPath, '/') ? folderPath : `${folderPath}/`

    try {
      if (archive.entryExists(entryPath)) {
        this.showError('errorFolderExists')
        return
      }
      archive.createFolder(entryPath)
      await this.refresh()
      toast.success(i18n.t('folderCreated'))
    } catch {
      this.showError('errorCreateFolder')
    }
  }

  async extractSelection() {
    if (!this.isOpen || isEmpty(this.selectedPaths)) return

    const result = await tinker.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || isEmpty(result.filePaths)) return

    try {
      archive.extractEntries(this.selectedPaths.slice(), result.filePaths[0])
      toast.success(i18n.t('extractSuccess'))
    } catch {
      this.showError('errorExtract')
    }
  }

  async extractAll() {
    if (!this.isOpen) return

    const result = await tinker.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || isEmpty(result.filePaths)) return

    try {
      archive.extractAll(result.filePaths[0])
      toast.success(i18n.t('extractSuccess'))
    } catch {
      this.showError('errorExtract')
    }
  }

  async deleteSelection() {
    if (!this.isOpen || isEmpty(this.selectedPaths)) return

    try {
      archive.deleteEntries(this.selectedPaths.slice())
      await this.refresh()
      toast.success(i18n.t('deleteSuccess'))
    } catch {
      this.showError('errorDelete')
    }
  }
}

export default new Store()
