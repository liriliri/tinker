import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import LocalStore from 'licia/LocalStore'
import randomItem from 'licia/randomItem'
import audio from './lib/audio'

interface Track {
  id: string
  title: string
  artist: string
  duration: number
  path: string
}

export type PlayMode = 'sequence' | 'loop' | 'shuffle'

const storage = new LocalStore('tinker-music-player')

class Store extends BaseStore {
  tracks: Track[] = []
  currentIndex: number = -1
  isPlaying: boolean = false
  currentTime: number = 0
  duration: number = 0
  volume: number = 0.8
  playMode: PlayMode = 'sequence'
  searchQuery: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.load()
    this.setupAudio()
  }

  private load() {
    this.tracks = storage.get<Track[]>('tracks') || []
    this.volume = storage.get<number>('volume') ?? 0.8
    this.playMode = storage.get<PlayMode>('playMode') || 'sequence'
    audio.setVolume(this.volume)
  }

  private save() {
    storage.set('tracks', this.tracks)
    storage.set('volume', this.volume)
    storage.set('playMode', this.playMode)
  }

  private setupAudio() {
    audio.onTimeUpdate = (currentTime, duration) => {
      runInAction(() => {
        this.currentTime = currentTime
        this.duration = duration || 0
      })
    }

    audio.onEnded = () => {
      this.playNext()
    }

    audio.onLoadedMetadata = (duration) => {
      runInAction(() => {
        this.duration = duration
        if (this.currentTrack && this.currentTrack.duration === 0) {
          this.currentTrack.duration = duration
          this.save()
        }
      })
    }

    audio.onError = () => {
      runInAction(() => {
        this.isPlaying = false
      })
    }
  }

  get currentTrack(): Track | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.tracks.length) {
      return this.tracks[this.currentIndex]
    }
    return null
  }

  get filteredTracks(): Track[] {
    if (!this.searchQuery) return this.tracks
    const q = this.searchQuery.toLowerCase()
    return this.tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    )
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  async addFiles(filePaths: string[]) {
    const newTracks: Track[] = filePaths.map((path) => {
      const fileName = path.split('/').pop() || path
      const title = fileName.replace(/\.[^.]+$/, '')
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        artist: 'Unknown',
        duration: 0,
        path,
      }
    })
    this.tracks.push(...newTracks)
    this.save()
  }

  removeTrack(id: string) {
    const index = this.tracks.findIndex((t) => t.id === id)
    if (index === -1) return
    if (index === this.currentIndex) {
      audio.pause()
      this.isPlaying = false
      this.currentIndex = -1
    } else if (index < this.currentIndex) {
      this.currentIndex--
    }
    this.tracks.splice(index, 1)
    this.save()
  }

  async playTrack(index: number) {
    if (index < 0 || index >= this.tracks.length) return
    this.currentIndex = index
    const track = this.tracks[index]
    try {
      await audio.play(`file://${track.path}`)
      runInAction(() => {
        this.isPlaying = true
      })
    } catch {
      runInAction(() => {
        this.isPlaying = false
      })
    }
  }

  async togglePlay() {
    if (this.currentIndex === -1) {
      if (this.tracks.length > 0) {
        await this.playTrack(0)
      }
      return
    }
    if (this.isPlaying) {
      audio.pause()
      this.isPlaying = false
    } else {
      try {
        await audio.play()
        runInAction(() => {
          this.isPlaying = true
        })
      } catch {
        runInAction(() => {
          this.isPlaying = false
        })
      }
    }
  }

  async playNext() {
    if (this.tracks.length === 0) return
    let nextIndex: number
    if (this.playMode === 'loop') {
      nextIndex = this.currentIndex
    } else if (this.playMode === 'shuffle') {
      const otherTracks = this.tracks.filter((_, i) => i !== this.currentIndex)
      if (otherTracks.length === 0) {
        nextIndex = this.currentIndex
      } else {
        const picked = randomItem(otherTracks)
        nextIndex = this.tracks.indexOf(picked)
      }
    } else {
      nextIndex = (this.currentIndex + 1) % this.tracks.length
    }
    await this.playTrack(nextIndex)
  }

  async playPrev() {
    if (this.tracks.length === 0) return
    if (this.currentTime > 3) {
      this.seek(0)
      return
    }
    const prevIndex =
      (this.currentIndex - 1 + this.tracks.length) % this.tracks.length
    await this.playTrack(prevIndex)
  }

  seek(time: number) {
    audio.seek(time)
    this.currentTime = time
  }

  setVolume(volume: number) {
    this.volume = volume
    audio.setVolume(volume)
    this.save()
  }

  setPlayMode(mode: PlayMode) {
    this.playMode = mode
    this.save()
  }

  cyclePlayMode() {
    const modes: PlayMode[] = ['sequence', 'loop', 'shuffle']
    const currentIdx = modes.indexOf(this.playMode)
    this.setPlayMode(modes[(currentIdx + 1) % modes.length])
  }
}

export default new Store()
