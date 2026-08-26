import { makeAutoObservable } from 'mobx'
import find from 'licia/find'
import isMac from 'licia/isMac'
import i18n from 'i18next'
import toast from 'react-hot-toast'
import BaseStore from 'share/store/Base'

type SourceType = 'screen' | 'window'
type RecorderState = 'idle' | 'recording' | 'preview'

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

  get isRecording() {
    return this.recorderState === 'recording'
  }

  get isPreview() {
    return this.recorderState === 'preview'
  }

  get canRecord() {
    return !!this.selectedId && this.recorderState === 'idle'
  }

  setSelectedId(id: string) {
    if (this.recorderState !== 'idle') return
    this.selectedId = id
  }

  async switchSourceType(type: SourceType) {
    if (this.sourceType === type) return
    this.sourceType = type
    this.selectedId = ''
    await this.loadSources()
  }

  async loadSources() {
    this.loadingSources = true
    try {
      this.sources = await tinker.getCaptureSources({
        types: [this.sourceType],
      })
      this.selectedId =
        find(this.sources, (s) => s.id === this.selectedId)?.id ||
        this.sources[0]?.id ||
        ''
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
