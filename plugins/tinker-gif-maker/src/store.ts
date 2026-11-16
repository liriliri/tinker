import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import endWith from 'licia/endWith'
import isEmpty from 'licia/isEmpty'
import remove from 'licia/remove'
import splitPath from 'licia/splitPath'
import i18n from 'i18next'
import toast from 'react-hot-toast'
import BaseStore, { storage } from 'share/store/Base'
import { isOnline } from 'share/lib/util'
import { THEME_COLORS } from 'share/theme'
import {
  createBlankFrame,
  createFrameFromFile,
  decodeGif,
  DEFAULT_DELAY_MS,
  MAX_DELAY_MS,
  MIN_DELAY_MS,
  revokeFrameUrls,
} from './lib/gif'
import { exportGif } from './lib/exportGif'
import type { GifFrame } from './types'

const STORAGE_BACKGROUND = 'backgroundColor'
const DEFAULT_BACKGROUND_COLOR = THEME_COLORS.bg.light.primary

class Store extends BaseStore {
  filePath = ''
  fileName = ''
  width = 0
  height = 0
  frames: GifFrame[] = []
  selectedIndex = 0
  isPlaying = false
  loading = false
  exporting = false
  delayDialogOpen = false
  backgroundColor: string = DEFAULT_BACKGROUND_COLOR

  private playTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    const saved = storage.get<string | undefined>(STORAGE_BACKGROUND)
    if (saved) this.backgroundColor = saved
  }

  setBackgroundColor(color: string) {
    this.backgroundColor = color
    storage.set(STORAGE_BACKGROUND, color)

    const oldBlanks: GifFrame[] = []
    const next = this.frames.map((frame) => {
      if (!frame.isBlank) return frame
      oldBlanks.push(frame)
      const updated = createBlankFrame(
        frame.width,
        frame.height,
        frame.delay,
        color
      )
      updated.id = frame.id
      return updated
    })
    if (isEmpty(oldBlanks)) return
    revokeFrameUrls(oldBlanks)
    this.frames = next
  }

  get hasProject() {
    return !isEmpty(this.frames)
  }

  get currentFrame(): GifFrame | null {
    return this.frames[this.selectedIndex] ?? null
  }

  get frameCount() {
    return this.frames.length
  }

  private applyDecoded(
    frames: GifFrame[],
    width: number,
    height: number,
    fileName: string,
    filePath = ''
  ) {
    revokeFrameUrls(this.frames)
    this.frames = frames
    this.width = width
    this.height = height
    this.selectedIndex = 0
    this.filePath = filePath
    this.fileName = fileName
    tinker.setTitle(this.fileName)
  }

  private clearProject() {
    revokeFrameUrls(this.frames)
    this.frames = []
    this.width = 0
    this.height = 0
    this.selectedIndex = 0
    this.filePath = ''
    this.fileName = ''
    tinker.setTitle('')
  }

  private insertFrames(frames: GifFrame[], atIndex: number) {
    if (isEmpty(frames)) return
    const next = this.frames.slice()
    next.splice(atIndex, 0, ...frames)
    this.frames = next
    this.selectedIndex = atIndex + frames.length - 1
  }

  newProject(width: number, height: number) {
    this.stopPlayback()
    const frame = createBlankFrame(
      width,
      height,
      DEFAULT_DELAY_MS,
      this.backgroundColor
    )
    this.applyDecoded([frame], frame.width, frame.height, 'Untitled.gif')
  }

  private async loadGifData(data: Uint8Array, fileName: string, filePath = '') {
    this.loading = true
    this.stopPlayback()
    try {
      const { frames, width, height } = await decodeGif(data)
      runInAction(() => {
        this.applyDecoded(frames, width, height, fileName, filePath)
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async openPath(path: string) {
    const data = new Uint8Array(await tinker.readFile(path))
    await this.loadGifData(data, splitPath(path).name || path, path)
  }

  async openFromFile(file: File, path?: string) {
    const data = new Uint8Array(await file.arrayBuffer())
    await this.loadGifData(data, file.name || 'Untitled.gif', path || '')
  }

  async addFramesFromFiles(files: File[]) {
    if (!this.hasProject || isEmpty(files)) return
    this.stopPlayback()
    this.loading = true
    try {
      const delay = this.currentFrame?.delay
      const frames: GifFrame[] = []
      for (const file of files) {
        const created = await createFrameFromFile(
          file,
          this.width,
          this.height,
          delay,
          this.backgroundColor
        )
        frames.push(...created)
      }
      runInAction(() => {
        this.insertFrames(frames, this.selectedIndex + 1)
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async replaceSelectedFrame(file: File) {
    if (!this.currentFrame) return
    this.stopPlayback()
    this.loading = true
    try {
      const delay = this.currentFrame.delay
      const created = await createFrameFromFile(
        file,
        this.width,
        this.height,
        delay,
        this.backgroundColor
      )
      runInAction(() => {
        const index = this.selectedIndex
        const old = this.frames[index]
        const next = this.frames.slice()
        // Keep the first generated frame as the replacement image
        next[index] = created[0]
        this.frames = next
        revokeFrameUrls([old, ...created.slice(1)])
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  deleteSelectedFrame() {
    if (!this.hasProject) return
    this.stopPlayback()
    const index = this.selectedIndex
    const next = this.frames.slice()
    const removed = remove(next, (_item, i) => i === index)
    revokeFrameUrls(removed)
    if (isEmpty(next)) {
      this.clearProject()
      return
    }
    this.frames = next
    this.selectedIndex = Math.min(index, next.length - 1)
  }

  setFrameDelay(delay: number, applyToAll = false) {
    if (!this.hasProject) return
    const nextDelay = clamp(Math.round(delay), MIN_DELAY_MS, MAX_DELAY_MS)
    this.frames = this.frames.map((item, index) => {
      if (!applyToAll && index !== this.selectedIndex) return item
      return item.delay === nextDelay ? item : { ...item, delay: nextDelay }
    })
  }

  openDelayDialog() {
    if (!this.currentFrame) return
    this.delayDialogOpen = true
  }

  closeDelayDialog() {
    this.delayDialogOpen = false
  }

  async exportGif() {
    if (!this.hasProject || this.loading || this.exporting) return
    if (isOnline()) {
      toast.error(i18n.t('exportUnavailable'))
      return
    }

    const defaultName = endWith(this.fileName, '.gif')
      ? this.fileName
      : `${this.fileName || 'Untitled'}.gif`
    const result = await tinker.showSaveDialog({
      defaultPath: this.filePath || defaultName,
      filters: [{ name: 'GIF', extensions: ['gif'] }],
    })
    if (result.canceled || !result.filePath) return

    this.exporting = true
    this.stopPlayback()
    try {
      await exportGif(this.frames, result.filePath)
      runInAction(() => {
        this.filePath = result.filePath!
        this.fileName = splitPath(result.filePath!).name || defaultName
        tinker.setTitle(this.fileName)
      })
      toast.success(i18n.t('exportSuccess'))
    } catch {
      toast.error(i18n.t('exportFailed'))
    } finally {
      runInAction(() => {
        this.exporting = false
      })
    }
  }

  selectFrame(index: number) {
    if (index < 0 || index >= this.frames.length) return
    this.selectedIndex = index
  }

  selectPrev() {
    if (isEmpty(this.frames)) return
    this.selectedIndex =
      (this.selectedIndex - 1 + this.frames.length) % this.frames.length
  }

  selectNext() {
    if (isEmpty(this.frames)) return
    this.selectedIndex = (this.selectedIndex + 1) % this.frames.length
  }

  selectFirst() {
    this.selectedIndex = 0
  }

  selectLast() {
    if (isEmpty(this.frames)) return
    this.selectedIndex = this.frames.length - 1
  }

  togglePlay() {
    if (this.isPlaying) this.stopPlayback()
    else this.startPlayback()
  }

  startPlayback() {
    if (this.frames.length < 2) return
    this.isPlaying = true
    this.scheduleNextFrame()
  }

  stopPlayback() {
    this.isPlaying = false
    if (this.playTimer) {
      clearTimeout(this.playTimer)
      this.playTimer = null
    }
  }

  private scheduleNextFrame() {
    if (!this.isPlaying) return
    const frame = this.frames[this.selectedIndex]
    if (!frame) {
      this.stopPlayback()
      return
    }
    this.playTimer = setTimeout(() => {
      runInAction(() => {
        if (!this.isPlaying) return
        this.selectNext()
        this.scheduleNextFrame()
      })
    }, frame.delay)
  }
}

export default new Store()
