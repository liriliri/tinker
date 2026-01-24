import BaseStore from 'share/BaseStore'
import { makeAutoObservable } from 'mobx'

type RecorderState =
  | 'wait_record'
  | 'active'
  | 'active_paused'
  | 'processing'
  | 'preview'

class Store extends BaseStore {
  recorderState: RecorderState = 'wait_record'
  currentRecordingDuration = 0
  recordedBlob: Blob | null = null
  microphoneBlocked = false
  isPlaying = false
  currentPlayTime = 0

  private recordingTimer: NodeJS.Timeout | null = null

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get isRecording() {
    return this.recorderState === 'active'
  }

  get isPaused() {
    return this.recorderState === 'active_paused'
  }

  get isWaitingToRecord() {
    return this.recorderState === 'wait_record'
  }

  get isPreview() {
    return this.recorderState === 'preview'
  }

  get isProcessing() {
    return this.recorderState === 'processing'
  }

  setRecorderState(state: RecorderState) {
    this.recorderState = state
  }

  setMicrophoneBlocked(blocked: boolean) {
    this.microphoneBlocked = blocked
  }

  startRecording() {
    this.recorderState = 'active'
    this.currentRecordingDuration = 0
    this.startTimer()
  }

  pauseRecording() {
    this.recorderState = 'active_paused'
    this.stopTimer()
  }

  resumeRecording() {
    this.recorderState = 'active'
    this.startTimer()
  }

  stopRecording(blob: Blob) {
    this.stopTimer()
    this.recordedBlob = blob
    this.recorderState = 'processing'

    // Simulate processing time
    setTimeout(() => {
      this.recorderState = 'preview'
    }, 1000)
  }

  reset() {
    this.recorderState = 'wait_record'
    this.currentRecordingDuration = 0
    this.recordedBlob = null
    this.isPlaying = false
    this.currentPlayTime = 0
    this.stopTimer()
  }

  setPlaying(playing: boolean) {
    this.isPlaying = playing
  }

  setCurrentPlayTime(time: number) {
    this.currentPlayTime = time
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
