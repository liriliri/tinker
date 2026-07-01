import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import LocalStore from 'licia/LocalStore'
import clamp from 'licia/clamp'
import contain from 'licia/contain'
import isEqual from 'licia/isEqual'
import isStrBlank from 'licia/isStrBlank'
import lowerCase from 'licia/lowerCase'
import normalizePath from 'licia/normalizePath'
import uuid from 'licia/uuid'
import i18n from 'i18next'
import toast from 'react-hot-toast'
import pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { fileExists } from 'share/lib/util'
import {
  getAllBooks,
  putBooks,
  clearBooks as dbClearBooks,
  removeBook as dbRemoveBook,
} from './lib/db'
import {
  findBookByPath,
  getBookDisplayTitle,
  isPathUnderScanDirs,
  normalizeScanDir,
} from './lib/util'
import type { Book } from './types'
import type { BookMeta } from '../common/types'

const storage = new LocalStore('tinker-reader')
const STORAGE_SCAN_DIRS = 'scanDirs'
const STORAGE_SCAN_DIR_CHECKED = 'scanDirChecked'
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const STORAGE_SIDEBAR_VIEW = 'sidebarView'
const COVER_MAX_CONCURRENCY = 2

export type SidebarView = 'thumbnails' | 'outline'

class Store extends BaseStore {
  books: Book[] = []
  searchQuery: string = ''
  showScanDialog: boolean = false
  scanDirs: string[] = []
  scanDirChecked: string[] = []
  isScanning: boolean = false

  readerOpen: boolean = false
  currentBookId: string | null = null
  isLoading: boolean = false

  pdfDoc: PDFDocumentProxy | null = null
  numPages: number = 0
  currentPage: number = 1
  scale: number = 1.0
  userHasZoomed: boolean = false
  scrollToPage: number = 0
  containerWidth: number = 0

  sidebarOpen: boolean = true
  sidebarView: SidebarView = 'thumbnails'

  private coverQueue: Promise<void> = Promise.resolve()
  private coverActiveCount: number = 0
  private coverWaiters: Array<() => void> = []

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
    this.loadDb()
  }

  private loadStorage() {
    const rawDirs = storage.get<string[]>(STORAGE_SCAN_DIRS) ?? []
    const rawChecked = storage.get<string[]>(STORAGE_SCAN_DIR_CHECKED) ?? []
    this.scanDirs = rawDirs.map(normalizeScanDir)
    this.scanDirChecked = rawChecked
      .map(normalizeScanDir)
      .filter((dir) => contain(this.scanDirs, dir))
    if (
      !isEqual(rawDirs, this.scanDirs) ||
      !isEqual(rawChecked, this.scanDirChecked)
    ) {
      this.persistScanDirs()
    }

    const savedSidebarOpen = storage.get(STORAGE_SIDEBAR_OPEN)
    if (savedSidebarOpen !== undefined) {
      this.sidebarOpen = savedSidebarOpen
    }
    const savedSidebarView = storage.get(STORAGE_SIDEBAR_VIEW)
    if (savedSidebarView === 'thumbnails' || savedSidebarView === 'outline') {
      this.sidebarView = savedSidebarView
    }
  }

  private async loadDb() {
    const books = await getAllBooks()
    runInAction(() => {
      this.books = this.sortBooks(books)
    })
  }

  private sortBooks(books: Book[]): Book[] {
    return [...books].sort((a, b) => {
      if (a.lastOpenedAt !== b.lastOpenedAt) {
        return b.lastOpenedAt - a.lastOpenedAt
      }
      return b.addedAt - a.addedAt
    })
  }

  get currentBook(): Book | null {
    if (!this.currentBookId) return null
    return this.books.find((book) => book.id === this.currentBookId) ?? null
  }

  get filteredBooks(): Book[] {
    if (isStrBlank(this.searchQuery)) return this.books
    const query = lowerCase(this.searchQuery)
    return this.books.filter(
      (book) =>
        lowerCase(getBookDisplayTitle(book)).includes(query) ||
        lowerCase(book.path).includes(query)
    )
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  get pages(): number[] {
    return Array.from({ length: this.numPages }, (_, i) => i + 1)
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
  }

  setSidebarView(view: SidebarView) {
    this.sidebarView = view
    storage.set(STORAGE_SIDEBAR_VIEW, view)
  }

  setContainerWidth(width: number) {
    this.containerWidth = width
  }

  showScanDialogView() {
    this.showScanDialog = true
  }

  hideScanDialog() {
    this.showScanDialog = false
  }

  addScanDir(path: string) {
    const dir = normalizeScanDir(path)
    if (contain(this.scanDirs, dir)) return
    this.scanDirs = [...this.scanDirs, dir]
    if (!contain(this.scanDirChecked, dir)) {
      this.scanDirChecked = [...this.scanDirChecked, dir]
    }
    this.persistScanDirs()
  }

  removeScanDir(path: string) {
    this.scanDirs = this.scanDirs.filter((dir) => dir !== path)
    this.scanDirChecked = this.scanDirChecked.filter((dir) => dir !== path)
    this.persistScanDirs()
  }

  toggleScanDirChecked(path: string) {
    if (contain(this.scanDirChecked, path)) {
      this.scanDirChecked = this.scanDirChecked.filter((dir) => dir !== path)
    } else {
      this.scanDirChecked = [...this.scanDirChecked, path]
    }
    this.persistScanDirs()
  }

  private persistScanDirs() {
    storage.set(STORAGE_SCAN_DIRS, this.scanDirs)
    storage.set(STORAGE_SCAN_DIR_CHECKED, this.scanDirChecked)
  }

  private createBook(meta: BookMeta): Book {
    const now = Date.now()
    return {
      id: uuid(),
      path: meta.path,
      title: meta.title,
      fileSize: meta.fileSize,
      numPages: 0,
      coverDataUrl: null,
      addedAt: now,
      lastOpenedAt: 0,
      lastPage: 1,
    }
  }

  async addFiles(filePaths: string[]) {
    const pendingPaths = filePaths.filter(
      (filePath) => !findBookByPath(this.books, filePath)
    )
    if (pendingPaths.length === 0) return

    const newBooks: Book[] = []
    for (const filePath of pendingPaths) {
      try {
        const meta = await reader.readBookMeta(filePath)
        const book = this.createBook(meta)
        newBooks.push(book)
      } catch (err) {
        console.error('Failed to read book meta:', filePath, err)
      }
    }

    if (newBooks.length === 0) return

    runInAction(() => {
      this.books = this.sortBooks([...this.books, ...newBooks])
    })
    await putBooks(newBooks)
  }

  async scanLocalBooks(checkedDirs: string[]) {
    const dirs = [...checkedDirs]
    if (dirs.length === 0) return

    runInAction(() => {
      this.isScanning = true
    })

    try {
      const filePaths = await reader.scanBookFiles(dirs)
      const scannedPaths = new Set(filePaths.map((file) => normalizePath(file)))

      const toRemove = this.books.filter(
        (book) =>
          isPathUnderScanDirs(book.path, dirs) &&
          !scannedPaths.has(normalizePath(book.path))
      )
      for (const book of toRemove) {
        await this.removeBook(book.id)
      }

      const pathsToAdd = filePaths.filter(
        (file) => !findBookByPath(this.books, file)
      )
      await this.addFiles(pathsToAdd)
    } finally {
      runInAction(() => {
        this.isScanning = false
      })
    }
  }

  async removeBook(id: string) {
    const index = this.books.findIndex((book) => book.id === id)
    if (index === -1) return

    this.books.splice(index, 1)
    await dbRemoveBook(id)

    if (this.currentBookId === id) {
      this.closeReader()
    }
  }

  async clearAllBooks() {
    runInAction(() => {
      this.books = []
      this.searchQuery = ''
    })
    this.closeReader()
    await dbClearBooks()
  }

  async openBook(book: Book) {
    if (!(await fileExists(book.path))) {
      toast.error(i18n.t('fileNotFound'))
      return
    }

    runInAction(() => {
      this.currentBookId = book.id
      this.readerOpen = true
      this.isLoading = true
    })

    await this.loadPdfDoc(book.path)

    runInAction(() => {
      const target = this.currentBook
      if (target) {
        target.lastOpenedAt = Date.now()
        if (target.lastPage > 1 && target.lastPage <= this.numPages) {
          this.currentPage = target.lastPage
          this.scrollToPage = target.lastPage
        }
      }
    })

    if (this.currentBook) {
      await putBooks([this.currentBook])
      runInAction(() => {
        this.books = this.sortBooks(this.books)
      })
    }
  }

  private async loadPdfDoc(filePath: string) {
    try {
      const fileData = await tinker.readFile(filePath)
      const loadingTask = pdfjsLib.getDocument({ data: fileData })
      const pdfDoc = await loadingTask.promise

      runInAction(() => {
        this.pdfDoc = pdfDoc
        this.numPages = pdfDoc.numPages
        this.currentPage = 1
        this.userHasZoomed = false
        this.isLoading = false
      })

      if (this.currentBook && this.currentBook.numPages !== pdfDoc.numPages) {
        runInAction(() => {
          if (this.currentBook) {
            this.currentBook.numPages = pdfDoc.numPages
          }
        })
        await putBooks([this.currentBook])
      }
    } catch (err) {
      console.error('Failed to load PDF:', err)
      toast.error(i18n.t('errorLoadPdf'))
      this.closeReader()
    }
  }

  closeReader() {
    if (this.pdfDoc) {
      void this.pdfDoc.destroy()
    }
    this.pdfDoc = null
    this.numPages = 0
    this.currentPage = 1
    this.scale = 1.0
    this.userHasZoomed = false
    this.scrollToPage = 0
    this.readerOpen = false
    this.currentBookId = null
    this.isLoading = false
  }

  setCurrentPage(page: number) {
    if (page < 1 || page > this.numPages) return
    this.currentPage = page
    this.persistLastPage(page)
  }

  nextPage() {
    if (this.currentPage >= this.numPages) return
    this.currentPage++
    this.scrollToPage = this.currentPage
    this.persistLastPage(this.currentPage)
  }

  prevPage() {
    if (this.currentPage <= 1) return
    this.currentPage--
    this.scrollToPage = this.currentPage
    this.persistLastPage(this.currentPage)
  }

  private persistLastPage(page: number) {
    const book = this.currentBook
    if (!book) return
    book.lastPage = page
    void putBooks([book])
  }

  setScale(scale: number, isUserAction: boolean = false) {
    const newScale = Math.round(scale * 100) / 100
    this.scale = clamp(newScale, 0.5, 3)
    if (isUserAction) {
      this.userHasZoomed = true
    }
  }

  zoomIn() {
    this.setScale(this.scale + 0.25, true)
  }

  zoomOut() {
    this.setScale(this.scale - 0.25, true)
  }

  async resetZoom() {
    const fitScale = await this.computeFitScale()
    this.setScale(fitScale, true)
  }

  private async computeFitScale(): Promise<number> {
    if (!this.pdfDoc || this.containerWidth <= 0) return 1.0
    try {
      const page = await this.pdfDoc.getPage(1)
      const viewport = page.getViewport({ scale: 1 })
      const availableWidth = Math.max(this.containerWidth - 32, 1)
      return clamp(availableWidth / viewport.width, 0.5, 1.0)
    } catch {
      return 1.0
    }
  }

  async showBookInFolder(book: Book) {
    if (!(await fileExists(book.path))) {
      toast.error(i18n.t('fileNotFound'))
      return
    }
    tinker.showItemInPath(book.path)
  }

  async generateCover(book: Book) {
    if (book.coverDataUrl !== null) return
    await this.enqueueCoverTask(async () => {
      if (book.coverDataUrl !== null) return
      try {
        const fileData = await tinker.readFile(book.path)
        const pdf = await pdfjsLib.getDocument({ data: fileData }).promise
        try {
          const page = await pdf.getPage(1)
          const viewport = page.getViewport({ scale: 1 })
          const targetWidth = 200
          const scale = targetWidth / viewport.width
          const scaledViewport = page.getViewport({ scale })

          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(scaledViewport.width)
          canvas.height = Math.floor(scaledViewport.height)
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          await page.render({
            canvasContext: ctx,
            viewport: scaledViewport,
            canvas,
          }).promise

          const dataUrl = canvas.toDataURL('image/png')
          runInAction(() => {
            book.coverDataUrl = dataUrl
          })
          await putBooks([book])
        } finally {
          await pdf.destroy()
        }
      } catch (err) {
        console.error('Failed to generate cover:', book.path, err)
      }
    })
  }

  private async enqueueCoverTask(task: () => Promise<void>): Promise<void> {
    const run = this.coverQueue.then(async () => {
      await this.acquireCoverSlot()
      try {
        await task()
      } finally {
        this.releaseCoverSlot()
      }
    })
    this.coverQueue = run.then(
      () => undefined,
      () => undefined
    )
    return run
  }

  private async acquireCoverSlot() {
    if (this.coverActiveCount < COVER_MAX_CONCURRENCY) {
      this.coverActiveCount++
      return
    }
    await new Promise<void>((resolve) => {
      this.coverWaiters.push(resolve)
    })
    this.coverActiveCount++
  }

  private releaseCoverSlot() {
    this.coverActiveCount--
    const next = this.coverWaiters.shift()
    if (next) next()
  }
}

export default new Store()
