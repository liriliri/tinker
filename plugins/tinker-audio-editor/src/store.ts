import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

interface HistoryEntry {
  buffer: AudioBuffer
  label: string
}

class Store extends BaseStore {
  audioBuffer: AudioBuffer | null = null
  audioBlob: Blob | null = null
  fileName: string = ''

  isPlaying: boolean = false
  currentTime: number = 0
  duration: number = 0

  selectionStart: number | null = null
  selectionEnd: number | null = null

  clipboardBuffer: AudioBuffer | null = null

  undoStack: HistoryEntry[] = []
  redoStack: HistoryEntry[] = []

  isLoading: boolean = false
  zoom: number = 1

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get hasAudio() {
    return this.audioBuffer !== null
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

  setAudio(blob: Blob, buffer: AudioBuffer, name: string) {
    this.audioBlob = blob
    this.audioBuffer = buffer
    this.fileName = name
    this.duration = buffer.duration
    this.currentTime = 0
    this.isPlaying = false
    this.undoStack = []
    this.redoStack = []
    this.selectionStart = null
    this.selectionEnd = null
  }

  setBuffer(buffer: AudioBuffer, label: string) {
    if (this.audioBuffer) {
      if (this.undoStack.length >= 20) this.undoStack.shift()
      this.undoStack.push({ buffer: this.audioBuffer, label })
    }
    this.redoStack = []
    this.audioBuffer = buffer
    this.duration = buffer.duration
    this.selectionStart = null
    this.selectionEnd = null
  }

  undo() {
    const entry = this.undoStack.pop()
    if (!entry || !this.audioBuffer) return
    this.redoStack.push({ buffer: this.audioBuffer, label: entry.label })
    this.audioBuffer = entry.buffer
    this.duration = entry.buffer.duration
    this.selectionStart = null
    this.selectionEnd = null
  }

  redo() {
    const entry = this.redoStack.pop()
    if (!entry || !this.audioBuffer) return
    this.undoStack.push({ buffer: this.audioBuffer, label: entry.label })
    this.audioBuffer = entry.buffer
    this.duration = entry.buffer.duration
    this.selectionStart = null
    this.selectionEnd = null
  }

  setSelection(start: number, end: number) {
    this.selectionStart = start
    this.selectionEnd = end
  }

  clearSelection() {
    this.selectionStart = null
    this.selectionEnd = null
  }

  setClipboard(buffer: AudioBuffer) {
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

  setZoom(zoom: number) {
    this.zoom = zoom
  }
}

export default new Store()
