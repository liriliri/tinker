import { makeAutoObservable } from 'mobx'
import find from 'licia/find'
import isMac from 'licia/isMac'
import i18n from 'i18next'
import toast from 'react-hot-toast'
import BaseStore from 'share/store/Base'

type SourceType = 'screen' | 'window'
type RecorderState = 'idle' | 'recording' | 'paused' | 'preview'

class Store extends BaseStore {
  sourceType: SourceType = 'screen'
  sources: tinker.CaptureSource[] = []
  selectedId = ''
  loadingSources = false

  recorderState: RecorderState = 'idle'
  currentRecordingDuration = 0
  recordedBlob: Blob | null = null

  private recordingTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get selectedSource() {
    return find(this.sources, (s) => s.id === this.selectedId) || null
  }

  get isRecording() {
    return this.recorderState === 'recording'
  }

  get isPaused() {
    return this.recorderState === 'paused'
  }

  get isPreview() {
    return this.recorderState === 'preview'
  }

  get canRecord() {
    return !!this.selectedId && this.recorderState === 'idle'
  }

  setSourceType(type: SourceType) {
    if (this.sourceType === type) return
    this.sourceType = type
    this.selectedId = ''
  }

  setSelectedId(id: string) {
    if (this.recorderState !== 'idle') return
    this.selectedId = id
  }

  async switchSourceType(type: SourceType) {
    this.setSourceType(type)
    await this.loadSources()
  }

  async loadSources() {
    this.loadingSources = true
    try {
      this.sources = await tinker.getCaptureSources({
        types: [this.sourceType],
      })
      if (
        this.selectedId &&
        !find(this.sources, (s) => s.id === this.selectedId)
      ) {
        this.selectedId = ''
      }
      if (!this.selectedId && this.sources.length > 0) {
        this.selectedId = this.sources[0].id
      }
    } catch {
      this.sources = []
      this.selectedId = ''
      toast.error(
        i18n.t(isMac ? 'screenPermissionRequired' : 'loadSourcesError')
      )
    } finally {
      this.loadingSources = false
    }
  }

  startRecording() {
    this.recorderState = 'recording'
    this.currentRecordingDuration = 0
    this.recordedBlob = null
    this.startTimer()
  }

  pauseRecording() {
    this.recorderState = 'paused'
    this.stopTimer()
  }

  resumeRecording() {
    this.recorderState = 'recording'
    this.startTimer()
  }

  stopRecording(blob: Blob) {
    this.stopTimer()
    this.recordedBlob = blob
    this.recorderState = 'preview'
  }

  reset() {
    this.recorderState = 'idle'
    this.currentRecordingDuration = 0
    this.recordedBlob = null
    this.stopTimer()
  }

  private startTimer() {
    this.stopTimer()
    this.recordingTimer = setInterval(() => {
      this.currentRecordingDuration += 1
    }, 1000)
  }

  private stopTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer)
      this.recordingTimer = null
    }
  }
}

export default new Store()
