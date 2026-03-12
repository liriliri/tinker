import { makeAutoObservable, observable, reaction } from 'mobx'
import BaseStore from 'share/BaseStore'
import { encodeWav } from './lib/audioUtils'

interface HistoryEntry {
  audioBuffer: AudioBuffer
  blobUrl: string
  label: string
}

function makeBlobUrl(buffer: AudioBuffer): string {
  const wav = encodeWav(buffer)
  return URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
}

class Store extends BaseStore {
  audioBuffer: AudioBuffer | null = null
  audioBlobUrl: string = ''
  isNewAudio: boolean = false
  fileName: string = ''

  isPlaying: boolean = false
  currentTime: number = 0

  selectionStart: number | null = null
  selectionEnd: number | null = null

  clipboardBuffer: AudioBuffer | null = null

  undoStack: HistoryEntry[] = []
  redoStack: HistoryEntry[] = []

  isLoading: boolean = false
  barHeight: number = 0.8
  leftMuted: boolean = false
  rightMuted: boolean = false

  constructor() {
    super()
    makeAutoObservable(this, {
      audioBuffer: observable.ref,
      clipboardBuffer: observable.ref,
    })
    reaction(
      () => this.fileName,
      (fileName) => {
        tinker.setTitle(fileName || '')
      }
    )
  }

  get hasAudio() {
    return this.audioBuffer !== null
  }

  get duration() {
    return this.audioBuffer?.duration ?? 0
  }

  get hasSelection() {
    return (
      this.selectionStart !== null &&
      this.selectionEnd !== null &&
      this.selectionEnd > this.selectionStart
    )
  }

  get canUndo() {
    return this.undoStack.length > 0
  }

  get canRedo() {
    return this.redoStack.length > 0
  }

  setAudio(audioBuffer: AudioBuffer, fileName: string) {
    this.undoStack.forEach((e) => URL.revokeObjectURL(e.blobUrl))
    this.redoStack.forEach((e) => URL.revokeObjectURL(e.blobUrl))
    if (this.audioBlobUrl) URL.revokeObjectURL(this.audioBlobUrl)
    this.audioBuffer = audioBuffer
    this.audioBlobUrl = makeBlobUrl(audioBuffer)
    this.isNewAudio = true
    this.fileName = fileName
    this.currentTime = 0
    this.isPlaying = false
    this.undoStack = []
    this.redoStack = []
    this.selectionStart = null
    this.selectionEnd = null
  }

  pushUndo(label: string) {
    if (!this.audioBuffer) return
    if (this.undoStack.length >= 20) {
      URL.revokeObjectURL(this.undoStack[0].blobUrl)
      this.undoStack.shift()
    }
    this.undoStack.push({
      audioBuffer: this.audioBuffer,
      blobUrl: this.audioBlobUrl,
      label,
    })
    this.redoStack.forEach((e) => URL.revokeObjectURL(e.blobUrl))
    this.redoStack = []
  }

  applyAudioBuffer(audioBuffer: AudioBuffer) {
    this.audioBuffer = audioBuffer
    this.audioBlobUrl = makeBlobUrl(audioBuffer)
    this.isNewAudio = false
    this.selectionStart = null
    this.selectionEnd = null
    this.isPlaying = false
    this.currentTime = 0
  }

  undo() {
    const entry = this.undoStack.pop()
    if (!entry) return
    this.redoStack.push({
      audioBuffer: this.audioBuffer!,
      blobUrl: this.audioBlobUrl,
      label: entry.label,
    })
    this.audioBuffer = entry.audioBuffer
    this.audioBlobUrl = entry.blobUrl
    this.isNewAudio = false
    this.selectionStart = null
    this.selectionEnd = null
    this.isPlaying = false
    this.currentTime = 0
  }

  redo() {
    const entry = this.redoStack.pop()
    if (!entry) return
    this.undoStack.push({
      audioBuffer: this.audioBuffer!,
      blobUrl: this.audioBlobUrl,
      label: entry.label,
    })
    this.audioBuffer = entry.audioBuffer
    this.audioBlobUrl = entry.blobUrl
    this.isNewAudio = false
    this.selectionStart = null
    this.selectionEnd = null
    this.isPlaying = false
    this.currentTime = 0
  }

  setSelection(start: number, end: number) {
    this.selectionStart = start
    this.selectionEnd = end
  }

  clearSelection() {
    this.selectionStart = null
    this.selectionEnd = null
  }

  setClipboardBuffer(buffer: AudioBuffer) {
    this.clipboardBuffer = buffer
  }

  setPlaying(playing: boolean) {
    this.isPlaying = playing
  }

  setCurrentTime(time: number) {
    this.currentTime = time
  }

  setLoading(loading: boolean) {
    this.isLoading = loading
  }

  setBarHeight(barHeight: number) {
    this.barHeight = barHeight
  }

  toggleLeftChannel() {
    this.leftMuted = !this.leftMuted
  }

  toggleRightChannel() {
    this.rightMuted = !this.rightMuted
  }
}

export default new Store()
