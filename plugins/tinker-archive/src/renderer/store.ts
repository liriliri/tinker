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
  isZipBasedArchive,
  joinZipPath,
  sortEntries,
  ZIP_BASED_EXTENSIONS,
} from './lib/util'
import { createMcpApi } from './mcp'

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
  readonly mcp = createMcpApi(() => this)

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

  async openArchivePath(filePath: string): Promise<boolean> {
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
      return true
    } catch {
      archive.close()
      runInAction(() => {
        this.archivePath = null
        this.entries = []
      })
      this.showError('errorOpenArchive')
      return false
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async openArchive() {
    const result = await tinker.showOpenDialog({
      filters: [
        {
          name: 'Archives',
          extensions: [...ZIP_BASED_EXTENSIONS],
        },
        { name: 'All Files', extensions: ['*'] },
      ],
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
    if (!isZipBasedArchive(filePath)) {
      this.showError('errorUnsupportedFormat')
      return
    }
    await this.openArchivePath(filePath)
  }

  async createArchive(filePath?: string): Promise<boolean> {
    let path = filePath
    if (!path) {
      const result = await tinker.showSaveDialog({
        defaultPath: 'archive.zip',
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
      })
      if (result.canceled || !result.filePath) return false
      path = result.filePath
    }

    if (!endWith(lowerCase(path), '.zip')) {
      path = `${path}.zip`
    }

    this.loading = true
    try {
      archive.create(path)
      runInAction(() => {
        this.archivePath = path
        this.history = []
        this.historyIndex = -1
        this.filterText = ''
      })
      await this.loadEntries('', true)
      toast.success(i18n.t('createSuccess'))
      return true
    } catch {
      archive.close()
      runInAction(() => {
        this.archivePath = null
        this.entries = []
      })
      this.showError('errorCreateArchive')
      return false
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

  async addFiles(filePaths?: string[], destDir?: string): Promise<boolean> {
    if (!this.isOpen) return false

    let paths = filePaths
    if (!paths) {
      const result = await tinker.showOpenDialog({
        properties: ['openFile', 'openDirectory', 'multiSelections'],
      })
      if (result.canceled || isEmpty(result.filePaths)) return false
      paths = result.filePaths
    }

    try {
      archive.addFiles(paths, destDir ?? this.currentPath)
      await this.refresh()
      toast.success(i18n.t('addSuccess'))
      return true
    } catch {
      this.showError('errorAddFiles')
      return false
    }
  }

  async createFolder(name: string): Promise<boolean> {
    if (!this.isOpen || isStrBlank(name)) return false

    const folderPath = joinZipPath(this.currentPath, trim(name))
    return this.createFolderAt(folderPath)
  }

  async createFolderAt(folderPath: string): Promise<boolean> {
    if (!this.isOpen || isStrBlank(folderPath)) return false

    const entryPath = endWith(folderPath, '/') ? folderPath : `${folderPath}/`

    try {
      if (archive.entryExists(entryPath)) {
        this.showError('errorFolderExists')
        return false
      }
      archive.createFolder(entryPath)
      await this.refresh()
      toast.success(i18n.t('folderCreated'))
      return true
    } catch {
      this.showError('errorCreateFolder')
      return false
    }
  }

  async extractSelection(destDir?: string): Promise<boolean> {
    if (!this.isOpen || isEmpty(this.selectedPaths)) return false
    return this.extractEntries(this.selectedPaths.slice(), destDir)
  }

  async extractEntries(
    entryPaths: string[],
    destDir?: string
  ): Promise<boolean> {
    if (!this.isOpen || isEmpty(entryPaths)) return false

    let dest = destDir
    if (!dest) {
      const result = await tinker.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
      })
      if (result.canceled || isEmpty(result.filePaths)) return false
      dest = result.filePaths[0]
    }

    try {
      archive.extractEntries(entryPaths, dest)
      toast.success(i18n.t('extractSuccess'))
      return true
    } catch {
      this.showError('errorExtract')
      return false
    }
  }

  async extractAll(destDir?: string): Promise<boolean> {
    if (!this.isOpen) return false

    let dest = destDir
    if (!dest) {
      const result = await tinker.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
      })
      if (result.canceled || isEmpty(result.filePaths)) return false
      dest = result.filePaths[0]
    }

    try {
      archive.extractAll(dest)
      toast.success(i18n.t('extractSuccess'))
      return true
    } catch {
      this.showError('errorExtract')
      return false
    }
  }

  async deleteSelection(): Promise<boolean> {
    if (!this.isOpen || isEmpty(this.selectedPaths)) return false
    return this.deleteEntries(this.selectedPaths.slice())
  }

  async deleteEntries(entryPaths: string[]): Promise<boolean> {
    if (!this.isOpen || isEmpty(entryPaths)) return false

    try {
      archive.deleteEntries(entryPaths)
      await this.refresh()
      toast.success(i18n.t('deleteSuccess'))
      return true
    } catch {
      this.showError('errorDelete')
      return false
    }
  }
}

export default new Store()
