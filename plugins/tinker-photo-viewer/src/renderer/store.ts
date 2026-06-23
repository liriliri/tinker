import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import LocalStore from 'licia/LocalStore'
import chunk from 'licia/chunk'
import contain from 'licia/contain'
import debounce from 'licia/debounce'
import isEqual from 'licia/isEqual'
import normalizePath from 'licia/normalizePath'
import sortBy from 'licia/sortBy'
import splitPath from 'licia/splitPath'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import i18n from 'i18next'
import toast from 'react-hot-toast'
import { fileExists } from 'share/lib/util'
import { IMAGE_EXTS } from 'share/lib/fileType'
import type { PhotoMeta } from '../common/types'
import {
  getAllPhotos,
  putPhotos,
  clearPhotos as dbClearPhotos,
  removePhoto as dbRemovePhoto,
} from './lib/db'
import {
  findPhotoByPath,
  isPathUnderScanDirs,
  normalizeScanDir,
  toDateSection,
} from './lib/util'
import { clearPhotoPreviewCache, clearPhotoThumbnailCache } from './lib/image'
import type { Photo, PhotoSection } from './types'

interface FileSearchResult {
  path: string
  name: string
}

const storage = new LocalStore('tinker-photo-viewer')
const IMPORT_BATCH_SIZE = 32

const STORAGE_SCAN_DIRS = 'scanDirs'
const STORAGE_SCAN_DIR_CHECKED = 'scanDirChecked'

class Store extends BaseStore {
  photos: Photo[] = []
  searchQuery: string = ''
  fileSearchResults: FileSearchResult[] = []
  isSearchingFiles: boolean = false
  showScanDialog: boolean = false
  scanDirs: string[] = []
  scanDirChecked: string[] = []
  isScanning: boolean = false
  viewerOpen: boolean = false
  viewerIndex: number = 0

  private searchFileTask: tinker.SearchFileTask | null = null

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
  }

  private async loadDb() {
    const photos = await getAllPhotos()
    runInAction(() => {
      this.photos = sortBy(photos, (photo) => -photo.createdAt)
    })
  }

  get photoSections(): PhotoSection[] {
    const sectionMap = new Map<string, Photo[]>()

    for (const photo of this.photos) {
      const sectionKey = toDateSection(photo.createdAt)
      const existing = sectionMap.get(sectionKey)
      if (existing) {
        existing.push(photo)
      } else {
        sectionMap.set(sectionKey, [photo])
      }
    }

    return [...sectionMap.entries()]
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([dateSection, photos]) => ({
        id: dateSection,
        label: dateSection,
        photos,
      }))
  }

  get currentPhoto(): Photo | null {
    if (!this.viewerOpen) return null
    return this.photos[this.viewerIndex] ?? null
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
    this.debouncedFileSearch(query)
  }

  private debouncedFileSearch = debounce((query: string) => {
    this.searchFiles(query)
  }, 300)

  private async searchFiles(query: string) {
    if (this.searchFileTask) {
      this.searchFileTask.kill()
      this.searchFileTask = null
    }

    if (!trim(query)) {
      runInAction(() => {
        this.fileSearchResults = []
        this.isSearchingFiles = false
      })
      return
    }

    runInAction(() => {
      this.isSearchingFiles = true
    })

    try {
      const exts = [...IMAGE_EXTS]
      const task = tinker.searchFile(query, {
        exts,
        maxResults: 20,
      })
      this.searchFileTask = task
      const results = await task
      runInAction(() => {
        this.fileSearchResults = results.map((result) => ({
          path: result.path,
          name: splitPath(result.path).name,
        }))
        this.isSearchingFiles = false
      })
    } catch {
      runInAction(() => {
        this.fileSearchResults = []
        this.isSearchingFiles = false
      })
    }
  }

  async addFromSearchResult(filePath: string) {
    const existing = findPhotoByPath(this.photos, filePath)
    if (existing) {
      this.searchQuery = ''
      this.fileSearchResults = []
      this.openViewer(existing)
      return
    }

    await this.addFiles([filePath])
    runInAction(() => {
      this.searchQuery = ''
      this.fileSearchResults = []
    })

    const photo = findPhotoByPath(this.photos, filePath)
    if (photo) {
      this.openViewer(photo)
    }
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

  private createPhoto(meta: PhotoMeta): Photo {
    const title = splitPath(meta.path).name
    return {
      id: uuid(),
      path: meta.path,
      title,
      width: meta.width,
      height: meta.height,
      size: meta.size,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      dateSection: toDateSection(meta.createdAt),
      format: meta.format,
    }
  }

  async addFiles(filePaths: string[]) {
    const pendingPaths = filePaths.filter(
      (filePath) => !findPhotoByPath(this.photos, filePath)
    )
    if (pendingPaths.length === 0) return

    for (const batchPaths of chunk(pendingPaths, IMPORT_BATCH_SIZE)) {
      const metas = await Promise.all(
        batchPaths.map(async (filePath) => {
          try {
            return await photoViewer.readPhotoMeta(filePath)
          } catch {
            return null
          }
        })
      )

      const newPhotos = metas
        .filter((meta): meta is PhotoMeta => meta !== null)
        .map((meta) => this.createPhoto(meta))

      if (newPhotos.length === 0) continue

      runInAction(() => {
        this.photos.unshift(...newPhotos)
        this.photos = sortBy(this.photos, (photo) => -photo.createdAt)
      })
      await putPhotos(newPhotos)
    }
  }

  updatePhotoFromThumbnail(
    path: string,
    width: number,
    height: number,
    takenAt?: number
  ) {
    const photo = findPhotoByPath(this.photos, path)
    if (!photo) return

    let changed = false

    runInAction(() => {
      if (width > 0 && height > 0 && (!photo.width || !photo.height)) {
        photo.width = width
        photo.height = height
        changed = true
      }

      if (takenAt && photo.createdAt === photo.updatedAt) {
        photo.createdAt = takenAt
        photo.dateSection = toDateSection(takenAt)
        changed = true
      }

      if (changed) {
        this.photos = sortBy(this.photos, (photo) => -photo.createdAt)
      }
    })

    if (changed) {
      void putPhotos([photo])
    }
  }

  async clearAllPhotos() {
    runInAction(() => {
      this.photos = []
      this.viewerOpen = false
      this.viewerIndex = 0
      this.searchQuery = ''
      this.fileSearchResults = []
    })
    await dbClearPhotos()
    clearPhotoThumbnailCache()
    clearPhotoPreviewCache()
  }

  async removePhoto(id: string) {
    const index = this.photos.findIndex((photo) => photo.id === id)
    if (index === -1) return

    this.photos.splice(index, 1)
    await dbRemovePhoto(id)

    if (this.viewerOpen) {
      const visiblePhotos = this.photos
      if (visiblePhotos.length === 0) {
        this.closeViewer()
      } else if (this.viewerIndex >= visiblePhotos.length) {
        this.viewerIndex = visiblePhotos.length - 1
      }
    }
  }

  async scanLocalPhotos(checkedDirs: string[]) {
    const dirs = [...checkedDirs]
    if (dirs.length === 0) return

    runInAction(() => {
      this.isScanning = true
    })

    try {
      const filePaths = await photoViewer.scanPhotoFiles(dirs)
      const scannedPaths = new Set(filePaths.map((file) => normalizePath(file)))

      const toRemove = this.photos.filter(
        (photo) =>
          isPathUnderScanDirs(photo.path, dirs) &&
          !scannedPaths.has(normalizePath(photo.path))
      )
      for (const photo of toRemove) {
        await this.removePhoto(photo.id)
      }

      const pathsToAdd = filePaths.filter(
        (file) => !findPhotoByPath(this.photos, file)
      )
      await this.addFiles(pathsToAdd)
    } finally {
      runInAction(() => {
        this.isScanning = false
      })
    }
  }

  openViewer(photo: Photo) {
    const index = this.photos.findIndex((item) => item.id === photo.id)
    if (index === -1) return
    this.viewerIndex = index
    this.viewerOpen = true
  }

  closeViewer() {
    this.viewerOpen = false
  }

  setViewerIndex(index: number) {
    const photos = this.photos
    if (index < 0 || index >= photos.length) return
    this.viewerIndex = index
  }

  async ensurePhotoExists(photo: Photo): Promise<boolean> {
    if (await fileExists(photo.path)) return true
    toast.error(i18n.t('fileNotFound'))
    return false
  }

  async showPhotoInFolder(photo: Photo) {
    if (!(await this.ensurePhotoExists(photo))) return
    tinker.showItemInPath(photo.path)
  }
}

export default new Store()
