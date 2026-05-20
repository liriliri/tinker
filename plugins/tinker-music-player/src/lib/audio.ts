class AudioController {
  private audio: HTMLAudioElement
  onTimeUpdate: ((currentTime: number, duration: number) => void) | null = null
  onEnded: (() => void) | null = null
  onError: ((error: string) => void) | null = null
  onLoadedMetadata: ((duration: number) => void) | null = null

  constructor() {
    this.audio = new Audio()

    this.audio.addEventListener('timeupdate', () => {
      this.onTimeUpdate?.(this.audio.currentTime, this.audio.duration)
    })

    this.audio.addEventListener('ended', () => {
      this.onEnded?.()
    })

    this.audio.addEventListener('error', () => {
      this.onError?.(this.audio.error?.message || 'Playback error')
    })

    this.audio.addEventListener('loadedmetadata', () => {
      this.onLoadedMetadata?.(this.audio.duration)
    })
  }

  async play(src?: string) {
    if (src) {
      this.audio.src = src
    }
    await this.audio.play()
  }

  pause() {
    this.audio.pause()
  }

  stop() {
    this.audio.pause()
    this.audio.src = ''
  }

  seek(time: number) {
    this.audio.currentTime = time
  }

  setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume))
  }

  get currentTime() {
    return this.audio.currentTime
  }

  get duration() {
    return this.audio.duration || 0
  }

  get paused() {
    return this.audio.paused
  }
}

export default new AudioController()
