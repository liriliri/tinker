import {
  canRedoAdjustmentHistory,
  canUndoAdjustmentHistory,
  cloneAdjustments,
  createAdjustmentHistory,
  createDefaultAdjustments,
  hasNonDefaultAdjustments,
  pushAdjustmentHistory,
  redoAdjustmentHistory,
  undoAdjustmentHistory,
} from './lib/adjustments'
import { makeAutoObservable, reaction, runInAction } from 'mobx'
import i18n from 'i18next'
import dateFormat from 'licia/dateFormat'
import each from 'licia/each'
import isBool from 'licia/isBool'
import isErr from 'licia/isErr'
import isObj from 'licia/isObj'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import toStr from 'licia/toStr'
import toast from 'react-hot-toast'
import BaseStore from 'share/BaseStore'
import { getFileExt, getMimeTypeFromPath } from 'share/lib/fileType'
import { openImageFile, resolveSavePath } from 'share/lib/util'
import { WebGLRenderer } from './lib/renderer'
import { createFilterAdjustments, PHOTO_FILTERS } from './lib/filters'
import { runWhenIdle } from './lib/idle'
import { extractJpegExif, injectJpegExif } from 'share/lib/exif'
import type {
  Adjustments,
  ImageInfo,
  MixerAdjustmentKey,
  MixerChannel,
  ScalarAdjustmentKey,
} from './types'
import {
  ADJUST_SECTION_IDS,
  DEFAULT_SECTION_OPEN,
  type AdjustSectionId,
  type SectionOpenState,
} from './types/adjustSections'

const storage = new LocalStore('tinker-photo-develop')
const STORAGE_SECTION_OPEN = 'sectionOpen'
const STORAGE_OVERWRITE = 'overwriteOriginal'

class Store extends BaseStore {
  image: ImageInfo | null = null
  adjustments: Adjustments = createDefaultAdjustments()
  sectionOpen: SectionOpenState
  previewVersion: number = 0
  isLoading: boolean = false
  isSaved: boolean = false
  overwriteOriginal: boolean = false
  adjustmentHistory: Adjustments[] = []
  historyIndex: number = 0
  activeFilterId: string | null = null

  private renderer: WebGLRenderer | null = null
  private renderFrame: number | null = null
  private isApplyingHistory = false
  private isApplyingFilter = false
  private historyCommitTimer: ReturnType<typeof setTimeout> | null = null
  private readonly historyDebounceMs = 500
  private jpegExifSegment: Uint8Array | null = null

  constructor() {
    super()
    this.sectionOpen = this.loadSectionOpenState()
    this.overwriteOriginal = this.loadOverwriteOriginal()
    makeAutoObservable(this)
    this.resetHistory(createDefaultAdjustments())
    this.bindEvent()
  }

  private bindEvent() {
    reaction(
      () => this.currentFileName,
      (fileName) => {
        tinker.setTitle(fileName || '')
      }
    )
  }

  initRenderer() {
    this.disposeRenderer()
    this.renderer = new WebGLRenderer()
  }

  disposeRenderer() {
    this.renderer?.dispose()
    this.renderer = null
  }

  async openImageDialog() {
    const result = await openImageFile({ title: i18n.t('openImage') })
    if (result) {
      await this.loadImage(result.file, result.filePath)
    }
  }

  async loadImage(file: File, filePath?: string) {
    if (!this.renderer) {
      throw new Error('WebGL renderer is not initialized')
    }

    try {
      this.isLoading = true
      const sourceBuffer = filePath
        ? new Uint8Array(await tinker.readFile(filePath))
        : new Uint8Array(await file.arrayBuffer())
      this.jpegExifSegment = extractJpegExif(sourceBuffer)

      const loadResult = await this.renderer.loadImage(file)

      runInAction(() => {
        this.image = {
          fileName: file.name,
          filePath,
          width: loadResult.width,
          height: loadResult.height,
        }
        this.resetHistory(createDefaultAdjustments())
        this.isSaved = false
        this.activeFilterId = null
        this.resetFilterPreviewCache()
      })

      if (loadResult.downscaled) {
        toast(
          i18n.t('imageDownscaled', {
            width: loadResult.width,
            height: loadResult.height,
            originalWidth: loadResult.originalWidth,
            originalHeight: loadResult.originalHeight,
          })
        )
      }

      this.drawPreview()
    } catch (err) {
      const message = isErr(err) ? err.message : toStr(err)
      toast.error(i18n.t('imageLoadFailed', { message }))
      console.error('Failed to load image:', err)
      throw err
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  setAdjustment<K extends ScalarAdjustmentKey>(key: K, value: Adjustments[K]) {
    this.adjustments = { ...this.adjustments, [key]: value }
    this.applyAdjustmentsChange()
  }

  setMixerAdjustment(
    channel: MixerChannel,
    key: MixerAdjustmentKey,
    value: number
  ) {
    this.adjustments = cloneAdjustments({
      ...this.adjustments,
      hsl: {
        ...this.adjustments.hsl,
        [channel]: {
          ...this.adjustments.hsl[channel],
          [key]: value,
        },
      },
    })
    this.applyAdjustmentsChange()
  }

  patchAdjustments(patch: Partial<Adjustments>) {
    this.adjustments = cloneAdjustments({
      ...this.adjustments,
      ...patch,
    })
    this.applyAdjustmentsChange()
  }

  resetAdjustments() {
    this.activeFilterId = null
    this.resetHistory(createDefaultAdjustments())
    this.scheduleRender()
  }

  applyFilter(filterId: string) {
    const adjustments =
      filterId === 'original'
        ? createDefaultAdjustments()
        : createFilterAdjustments(filterId)

    this.isApplyingFilter = true
    this.activeFilterId = filterId === 'original' ? null : filterId
    this.adjustments = cloneAdjustments(adjustments)
    this.cancelPendingHistoryCommit()
    this.pushHistory(adjustments)
    this.isApplyingFilter = false
    this.isSaved = false
    this.scheduleRender()
  }

  private filterPreviewQueue: Promise<void> = Promise.resolve()
  private filterPreviewCacheKey = ''
  private filterPreviewCache = new Map<string, string>()

  private getFilterPreviewCacheKey() {
    if (!this.image) return ''
    return `${this.image.fileName}:${this.image.width}x${this.image.height}`
  }

  private resetFilterPreviewCache() {
    this.filterPreviewCacheKey = ''
    this.filterPreviewCache.clear()
    this.filterPreviewQueue = Promise.resolve()
  }

  getFilterPreview(filterId: string) {
    if (this.filterPreviewCacheKey !== this.getFilterPreviewCacheKey()) {
      return undefined
    }

    return this.filterPreviewCache.get(filterId)
  }

  async generateAllFilterPreviews(
    maxWidth = 96,
    onPreview?: (filterId: string, url: string) => void
  ): Promise<Record<string, string>> {
    if (!this.renderer?.hasImage || this.isLoading) {
      return {}
    }

    const previews: Record<string, string> = {}

    for (const filter of PHOTO_FILTERS) {
      const url = await this.generateFilterPreview(filter.id, maxWidth)
      if (!url) continue

      previews[filter.id] = url
      onPreview?.(filter.id, url)
    }

    return previews
  }

  generateFilterPreview(filterId: string, maxWidth = 96): Promise<string> {
    if (!this.renderer?.hasImage) {
      return Promise.resolve('')
    }

    const cacheKey = this.getFilterPreviewCacheKey()
    if (this.filterPreviewCacheKey !== cacheKey) {
      this.filterPreviewCache.clear()
      this.filterPreviewCacheKey = cacheKey
    }

    const cached = this.filterPreviewCache.get(filterId)
    if (cached) {
      return Promise.resolve(cached)
    }

    const task = this.filterPreviewQueue.then(() =>
      runWhenIdle(() => {
        if (!this.renderer?.hasImage || this.isLoading) {
          return ''
        }

        const hit = this.filterPreviewCache.get(filterId)
        if (hit) {
          return hit
        }

        const savedAdjustments = cloneAdjustments(this.adjustments)
        const adjustments = createFilterAdjustments(filterId)
        const url = this.renderer.renderThumbnail(adjustments, maxWidth)
        this.renderer.render(savedAdjustments)

        if (url) {
          this.filterPreviewCache.set(filterId, url)
        }

        return url
      })
    )

    this.filterPreviewQueue = task.then(
      () => undefined,
      () => undefined
    )

    return task
  }

  undo() {
    this.applyHistoryStep(() =>
      undoAdjustmentHistory({
        history: this.adjustmentHistory,
        index: this.historyIndex,
      })
    )
  }

  redo() {
    this.applyHistoryStep(() =>
      redoAdjustmentHistory({
        history: this.adjustmentHistory,
        index: this.historyIndex,
      })
    )
  }

  private applyHistoryStep(
    getNext: () => { index: number } | null | undefined
  ) {
    this.cancelPendingHistoryCommit()
    const next = getNext()
    if (!next) return

    this.isApplyingHistory = true
    this.historyIndex = next.index
    this.adjustments = cloneAdjustments(
      this.adjustmentHistory[this.historyIndex]
    )
    this.activeFilterId = null
    this.isApplyingHistory = false
    this.isSaved = false
    this.scheduleRender()
  }

  resetHistory(initial: Adjustments) {
    this.cancelPendingHistoryCommit()
    const state = createAdjustmentHistory(initial)
    this.adjustmentHistory = state.history
    this.historyIndex = state.index
    this.adjustments = cloneAdjustments(initial)
  }

  pushHistory(newAdj: Adjustments) {
    const next = pushAdjustmentHistory(
      { history: this.adjustmentHistory, index: this.historyIndex },
      newAdj
    )
    this.adjustmentHistory = next.history
    this.historyIndex = next.index
  }

  private applyAdjustmentsChange() {
    if (this.isApplyingHistory || this.isApplyingFilter) return
    this.activeFilterId = null
    this.isSaved = false
    this.scheduleHistoryCommit()
    this.scheduleRender()
  }

  private scheduleHistoryCommit() {
    this.cancelPendingHistoryCommit()
    this.historyCommitTimer = setTimeout(() => {
      this.historyCommitTimer = null
      this.pushHistory(this.adjustments)
    }, this.historyDebounceMs)
  }

  private cancelPendingHistoryCommit() {
    if (this.historyCommitTimer === null) return
    clearTimeout(this.historyCommitTimer)
    this.historyCommitTimer = null
  }

  setSectionOpen(sectionId: AdjustSectionId, open: boolean) {
    if (this.sectionOpen[sectionId] === open) return

    this.sectionOpen = { ...this.sectionOpen, [sectionId]: open }
    this.saveSectionOpenState()
  }

  setOverwriteOriginal(overwrite: boolean) {
    this.overwriteOriginal = overwrite
    storage.set(STORAGE_OVERWRITE, String(overwrite))
  }

  private loadOverwriteOriginal(): boolean {
    const saved = storage.get(STORAGE_OVERWRITE)
    return saved === 'true'
  }

  private loadSectionOpenState(): SectionOpenState {
    const saved = storage.get(STORAGE_SECTION_OPEN) as
      | Partial<SectionOpenState>
      | undefined

    if (!isObj(saved)) {
      return { ...DEFAULT_SECTION_OPEN }
    }

    const next = { ...DEFAULT_SECTION_OPEN }
    const stored = saved as Partial<SectionOpenState>

    each(ADJUST_SECTION_IDS, (id) => {
      if (isBool(stored[id])) {
        next[id] = stored[id]
      }
    })

    return next
  }

  private saveSectionOpenState() {
    storage.set(STORAGE_SECTION_OPEN, this.sectionOpen)
  }

  scheduleRender() {
    if (!this.renderer?.hasImage) return

    if (this.renderFrame !== null) {
      cancelAnimationFrame(this.renderFrame)
    }

    this.renderFrame = requestAnimationFrame(() => {
      this.renderFrame = null
      this.drawPreview()
    })
  }

  drawPreview() {
    if (!this.renderer?.hasImage) return

    this.renderer.render(this.adjustments)
    this.previewVersion++
  }

  async saveImage() {
    if (!this.image || !this.renderer?.hasImage) return

    try {
      let savePath: string

      if (this.overwriteOriginal && this.image.filePath) {
        savePath = this.image.filePath
      } else {
        const result = await tinker.showSaveDialog({
          defaultPath: this.getDefaultSavePath(),
          filters: [
            {
              name: i18n.t('imageFiles'),
              extensions: ['png', 'jpg', 'jpeg', 'webp'],
            },
          ],
        })

        if (result.canceled || !result.filePath) {
          return
        }

        savePath = await resolveSavePath(result.filePath)
      }
      const ext = getFileExt(savePath) || 'png'
      const mimeType = getMimeTypeFromPath(savePath) || 'image/png'

      const blob = await this.renderer.exportBlob(this.adjustments, mimeType)
      let output = new Uint8Array(await blob.arrayBuffer())

      if (
        (ext === 'jpg' || ext === 'jpeg') &&
        this.jpegExifSegment &&
        output[0] === 0xff &&
        output[1] === 0xd8
      ) {
        output = injectJpegExif(output, this.jpegExifSegment)
      }

      await tinker.writeFile(savePath, output)

      runInAction(() => {
        this.isSaved = true
      })

      return savePath
    } catch (err) {
      console.error('Failed to save image:', err)
      throw err
    }
  }

  private getDefaultSavePath(): string {
    if (!this.image) return `image-${dateFormat('yyyymmddHH')}.png`

    const { name, ext } = splitPath(this.image.fileName)
    const stem = ext ? name.slice(0, -ext.length) : name
    const fileName = `${stem}-${dateFormat('yyyymmddHH')}${ext || '.png'}`

    if (this.image.filePath) {
      const { dir } = splitPath(this.image.filePath)
      return `${dir}${fileName}`
    }

    return fileName
  }

  get hasImage() {
    return this.image !== null
  }

  get currentFileName() {
    return this.image?.fileName ?? ''
  }

  get hasAdjustments() {
    return hasNonDefaultAdjustments(this.adjustments)
  }

  get canUndo() {
    return canUndoAdjustmentHistory({
      history: this.adjustmentHistory,
      index: this.historyIndex,
    })
  }

  get canRedo() {
    return canRedoAdjustmentHistory({
      history: this.adjustmentHistory,
      index: this.historyIndex,
    })
  }

  get previewCanvas() {
    return this.renderer?.canvas ?? null
  }
}

export default new Store()
