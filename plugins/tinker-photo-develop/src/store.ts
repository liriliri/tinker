import {
  cloneAdjustments,
  createDefaultAdjustments,
  hasNonDefaultAdjustments,
} from './lib/adjustments'
import {
  canRedoAdjustmentHistory,
  canUndoAdjustmentHistory,
  createAdjustmentHistory,
  pushAdjustmentHistory,
  redoAdjustmentHistory,
  undoAdjustmentHistory,
} from './lib/adjustmentHistory'
import { makeAutoObservable, reaction, runInAction } from 'mobx'
import i18n from 'i18next'
import isErr from 'licia/isErr'
import splitPath from 'licia/splitPath'
import toStr from 'licia/toStr'
import toast from 'react-hot-toast'
import BaseStore from 'share/BaseStore'
import { getFileExt, getMimeTypeFromPath } from 'share/lib/fileType'
import { openImageFile } from 'share/lib/util'
import { WebGLRenderer } from './lib/renderer'
import {
  loadSectionOpenState,
  saveSectionOpenState,
} from './lib/adjustSections'
import { extractJpegExif, injectJpegExif } from 'share/lib/exif'
import type {
  Adjustments,
  ImageInfo,
  MixerAdjustmentKey,
  MixerChannel,
  ScalarAdjustmentKey,
} from './types'
import type { AdjustSectionId, SectionOpenState } from './types/adjustSections'

class Store extends BaseStore {
  image: ImageInfo | null = null
  adjustments: Adjustments = createDefaultAdjustments()
  sectionOpen: SectionOpenState = loadSectionOpenState()
  previewVersion: number = 0
  isLoading: boolean = false
  isSaved: boolean = false
  adjustmentHistory: Adjustments[] = []
  historyIndex: number = 0

  private renderer: WebGLRenderer | null = null
  private renderFrame: number | null = null
  private isApplyingHistory = false
  private historyCommitTimer: ReturnType<typeof setTimeout> | null = null
  private readonly historyDebounceMs = 500
  private jpegExifSegment: Uint8Array | null = null

  constructor() {
    super()
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
    this.resetHistory(createDefaultAdjustments())
    this.scheduleRender()
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
    if (this.isApplyingHistory) return
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
    if (this.sectionOpen[sectionId] === open) {
      return
    }

    this.sectionOpen = { ...this.sectionOpen, [sectionId]: open }
    saveSectionOpenState(this.sectionOpen)
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
      const result = await tinker.showSaveDialog({
        defaultPath: this.getEditedFileName(this.image.fileName),
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

      const savePath = result.filePath
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

  private getEditedFileName(fileName: string): string {
    const { name, ext } = splitPath(fileName)
    const stem = ext ? name.slice(0, -ext.length) : name
    return `${stem}-edited${ext}`
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
