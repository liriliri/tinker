import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  stream: MediaStream | null = null
  error: string = ''
  isLoading: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setStream(stream: MediaStream | null) {
    this.stream = stream
  }

  setError(error: string) {
    this.error = error
  }

  setLoading(loading: boolean) {
    this.isLoading = loading
  }

  capturePhoto(videoElement: HTMLVideoElement) {
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `photo-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  }

  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }
}

const store = new Store()

export default store
