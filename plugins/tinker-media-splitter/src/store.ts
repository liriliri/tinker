import i18n from 'i18next'
import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import fileUrl from 'licia/fileUrl'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import remove from 'licia/remove'
import splitPath from 'licia/splitPath'
import BaseStore, { storage } from 'share/store/Base'
import { createMcpApi } from './mcp'
import { buildLosslessCutArgs, resolveSegmentOutputPath } from './lib/ffmpeg'
import {
  clampSegmentTimes,
  createSegment,
  defaultSegmentEnd,
  getExportableSegments,
  isZeroLengthSegment,
  canSplitSegmentAt,
  buildEqualSegments,
} from './lib/segments'
import { getMediaFileFilter, trimTrailingSlash } from './lib/util'
import type { MediaFile, Segment } from './types'

const STORAGE_OUTPUT_DIR = 'outputDir'
const STORAGE_KEYFRAME_CUT = 'keyframeCut'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  media: MediaFile | null = null
  segments: Segment[] = []
  activeSegmentId: string | null = null
  currentTime = 0
  /** Last seek / selection position (LLC commandedTime). */
  commandedTime = 0
  playing = false
  /** When set, MediaPlayer seeks the element then clears it. */
  seekRequest: number | null = null
  /** When set, MediaPlayer applies play/pause then clears it. */
  playCommand: 'pause' | 'toggle' | null = null
  keyframeCut = true
  outputDir = ''

  isExporting = false
  progress = 0
  exportIndex = 0
  exportTotal = 0
  private currentTask: tinker.FFmpegTask | null = null
  private cancelled = false

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
      currentTask: false,
      cancelled: false,
    } as Record<string, false>)
    this.outputDir = storage.get(STORAGE_OUTPUT_DIR) || ''
    const savedKeyframe = storage.get(STORAGE_KEYFRAME_CUT)
    if (typeof savedKeyframe === 'boolean') {
      this.keyframeCut = savedKeyframe
    }
  }

  get hasMedia() {
    return this.media !== null
  }

  get activeSegment(): Segment | null {
    if (!this.activeSegmentId) return null
    return find(this.segments, (seg) => seg.id === this.activeSegmentId) || null
  }

  get exportableCount() {
    return getExportableSegments(this.segments).length
  }

  get canSplitActiveSegment() {
    const seg = this.activeSegment
    if (!seg || this.isExporting) return false
    return canSplitSegmentAt(seg, this.commandedTime)
  }

  get duration() {
    return this.media?.duration ?? 0
  }

  async openMediaDialog() {
    if (this.isExporting) return
    const result = await tinker.showOpenDialog({
      title: i18n.t('openMedia'),
      properties: ['openFile'],
      filters: [getMediaFileFilter()],
    })
    if (result.canceled || !result.filePaths[0]) return
    await this.loadMedia(result.filePaths[0])
  }

  async browseOutputDir() {
    if (this.isExporting) return
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: this.outputDir || undefined,
    })
    if (result.canceled || !result.filePaths[0]) return
    this.setOutputDir(result.filePaths[0])
  }

  setOutputDir(dir: string) {
    this.outputDir = trimTrailingSlash(dir)
    storage.set(STORAGE_OUTPUT_DIR, this.outputDir)
  }

  setKeyframeCut(value: boolean) {
    this.keyframeCut = value
    storage.set(STORAGE_KEYFRAME_CUT, value)
  }

  async loadMedia(filePath: string) {
    if (this.isExporting) return
    const info = await tinker.getMediaInfo(filePath)
    if (!info.videoStream && !info.audioStream) {
      throw new Error('File has no audio or video stream')
    }
    if (!(info.duration > 0)) {
      throw new Error('Invalid media duration')
    }

    const { name } = splitPath(filePath)
    this.media = {
      filePath,
      fileName: name,
      src: `${fileUrl(filePath)}?t=${Date.now()}`,
      duration: info.duration,
      size: info.size,
      hasVideo: !!info.videoStream,
      hasAudio: !!info.audioStream,
      width: info.videoStream?.width ?? 0,
      height: info.videoStream?.height ?? 0,
    }
    this.segments = []
    this.activeSegmentId = null
    this.currentTime = 0
    this.commandedTime = 0
    this.playing = false
    this.playCommand = 'pause'
    this.seekRequest = 0
    this.progress = 0
    tinker.setTitle(name)
  }

  setCurrentTime(time: number) {
    this.currentTime = clamp(time, 0, this.duration)
  }

  setPlaying(playing: boolean) {
    this.playing = playing
  }

  togglePlay() {
    if (!this.media || this.isExporting) return
    this.playCommand = 'toggle'
  }

  clearPlayCommand() {
    this.playCommand = null
  }

  requestSeek(time: number) {
    const next = clamp(time, 0, this.duration)
    this.commandedTime = next
    this.currentTime = next
    this.seekRequest = next
  }

  clearSeekRequest() {
    this.seekRequest = null
  }

  seekRel(delta: number) {
    this.requestSeek(this.commandedTime + delta)
  }

  jumpToStart() {
    this.requestSeek(0)
  }

  jumpToEnd() {
    this.requestSeek(this.duration)
  }

  jumpToActiveStart() {
    const seg = this.activeSegment
    if (seg) this.requestSeek(seg.start)
  }

  jumpToActiveEnd() {
    const seg = this.activeSegment
    if (seg) this.requestSeek(seg.end)
  }

  setActiveSegment(id: string | null) {
    this.activeSegmentId = id
  }

  private updateSegmentTimes(seg: Segment, start: number, end: number) {
    const next = clampSegmentTimes(start, end, this.duration)
    if (isZeroLengthSegment(next.start, next.end)) {
      this.deleteSegment(seg.id)
      return
    }
    seg.start = next.start
    seg.end = next.end
  }

  private insertSegment(start: number, end: number) {
    if (isZeroLengthSegment(start, end)) return
    const seg = createSegment({ start, end })
    this.segments.push(seg)
    this.activeSegmentId = seg.id
  }

  setInPoint(time = this.currentTime) {
    if (!this.media || this.isExporting) return
    const t = clamp(time, 0, this.duration)
    const active = this.activeSegment

    if (active && t < active.end) {
      this.updateSegmentTimes(active, t, active.end)
      return
    }

    this.addSegment(t)
  }

  setOutPoint(time = this.currentTime) {
    if (!this.media || this.isExporting) return
    const t = clamp(time, 0, this.duration)
    const active = this.activeSegment

    if (active) {
      if (t <= active.start) {
        this.updateSegmentTimes(active, t, active.start)
      } else {
        this.updateSegmentTimes(active, active.start, t)
      }
      return
    }

    this.insertSegment(0, t)
  }

  addSegment(time = this.currentTime) {
    if (!this.media || this.isExporting) return
    const start = clamp(time, 0, this.duration)
    this.insertSegment(start, defaultSegmentEnd(start, this.duration))
  }

  splitActiveSegment(time = this.commandedTime) {
    if (!this.media || this.isExporting) return
    const seg = this.activeSegment
    if (!seg || !canSplitSegmentAt(seg, time)) return
    const end = seg.end
    const idx = findIdx(this.segments, (item) => item.id === seg.id)
    if (idx < 0) return
    seg.end = time
    this.segments.splice(idx + 1, 0, createSegment({ start: time, end }))
  }

  deleteActiveSegment() {
    if (!this.activeSegmentId || this.isExporting) return
    this.deleteSegment(this.activeSegmentId)
  }

  deleteSegment(id: string) {
    if (this.isExporting) return
    const idx = findIdx(this.segments, (seg) => seg.id === id)
    if (idx < 0) return
    remove(this.segments, (seg) => seg.id === id)
    if (this.activeSegmentId === id) {
      if (this.segments.length === 0) {
        this.activeSegmentId = null
      } else {
        const nextIdx = Math.min(idx, this.segments.length - 1)
        this.activeSegmentId = this.segments[nextIdx].id
      }
    }
  }

  clearSegments() {
    if (this.isExporting) return
    this.segments = []
    this.activeSegmentId = null
  }

  replaceSegments(ranges: { start: number; end: number }[]) {
    if (!this.media || this.isExporting) return
    this.segments = []
    this.activeSegmentId = null
    for (const range of ranges) {
      this.insertSegment(range.start, range.end)
    }
  }

  splitIntoEqualSegments(count: number) {
    if (!this.media || this.isExporting) return
    this.replaceSegments(buildEqualSegments(this.duration, count))
  }

  updateSegmentRange(id: string, start: number, end: number) {
    if (this.isExporting) return
    const seg = find(this.segments, (item) => item.id === id)
    if (!seg) return
    this.updateSegmentTimes(seg, start, end)
  }

  cancelExport() {
    if (!this.isExporting) return
    this.cancelled = true
    this.currentTask?.quit()
  }

  async exportSegments() {
    if (!this.media || this.isExporting) return

    const toExport = getExportableSegments(this.segments)
    if (toExport.length === 0) {
      throw new Error('NO_SEGMENTS')
    }

    let outDir = this.outputDir
    if (!outDir) {
      const { dir } = splitPath(this.media.filePath)
      outDir = dir
    }

    this.isExporting = true
    this.cancelled = false
    this.progress = 0
    this.exportIndex = 0
    this.exportTotal = toExport.length

    const outputs: string[] = []

    try {
      for (let i = 0; i < toExport.length; i++) {
        if (this.cancelled) break
        const segment = toExport[i]
        this.exportIndex = i + 1
        const outputPath = await resolveSegmentOutputPath(
          this.media.filePath,
          outDir,
          segment,
          toExport.length
        )
        const args = buildLosslessCutArgs({
          input: this.media.filePath,
          output: outputPath,
          cutFrom: segment.start,
          cutTo: segment.end,
          fileDuration: this.media.duration,
          keyframeCut: this.keyframeCut,
        })

        const baseProgress = (i / toExport.length) * 100
        const task = tinker.runFFmpeg(args, (progress) => {
          runInAction(() => {
            if (progress.percent !== undefined) {
              const local = Math.min(99, progress.percent)
              this.progress = Math.round(baseProgress + local / toExport.length)
            }
          })
        })
        this.currentTask = task
        await task
        this.currentTask = null
        outputs.push(outputPath)
        runInAction(() => {
          this.progress = Math.round(((i + 1) / toExport.length) * 100)
        })
      }

      if (this.cancelled) {
        throw new Error('CANCELLED')
      }
      return outputs
    } finally {
      runInAction(() => {
        this.isExporting = false
        this.currentTask = null
        this.cancelled = false
      })
    }
  }
}

export default new Store()
