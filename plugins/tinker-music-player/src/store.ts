import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import LocalStore from 'licia/LocalStore'
import randomItem from 'licia/randomItem'
import debounce from 'licia/debounce'
import splitPath from 'licia/splitPath'
import audio from './lib/audio'
import {
  Track,
  RecentTrack,
  MusicSheet,
  getAllTracks,
  putTracks,
  removeTrack as dbRemoveTrack,
  getRecentTracks,
  putRecentTracks,
  getAllSheets,
  putSheet,
  removeSheet as dbRemoveSheet,
} from './lib/db'

import { PlayMode, SideTab } from './types'

interface FileSearchResult {
  path: string
  name: string
}

const AUDIO_EXTS = ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'wma']
const FAVORITE_SHEET_ID = 'favorite'
const MAX_RECENT = 100

const settings = new LocalStore('tinker-music-player')

class Store extends BaseStore {
  tracks: Track[] = []
  recentTracks: RecentTrack[] = []
  sheets: MusicSheet[] = []
  activeTab: SideTab = 'local'
  activeSheetId: string = ''
  currentIndex: number = -1
  isPlaying: boolean = false
  showPlayQueue: boolean = false
  currentTime: number = 0
  duration: number = 0
  volume: number = 0.8
  playMode: PlayMode = 'sequence'
  searchQuery: string = ''
  listFilter: string = ''
  fileSearchResults: FileSearchResult[] = []
  isSearchingFiles: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.load()
    this.setupAudio()
  }

  private async load() {
    this.volume = settings.get<number>('volume') ?? 0.8
    this.playMode = settings.get<PlayMode>('playMode') || 'sequence'
    audio.setVolume(this.volume)

    const tracks = await getAllTracks()
    const recentTracks = await getRecentTracks()
    const sheets = await getAllSheets()
    runInAction(() => {
      this.tracks = tracks
      this.recentTracks = recentTracks
      this.sheets = sheets
      if (!sheets.find((s) => s.id === FAVORITE_SHEET_ID)) {
        const favoriteSheet: MusicSheet = {
          id: FAVORITE_SHEET_ID,
          title: '',
          trackIds: [],
          createdAt: 0,
        }
        this.sheets.unshift(favoriteSheet)
        putSheet(favoriteSheet)
      }

      const savedTrackId = settings.get<string>('currentTrackId')
      if (savedTrackId) {
        const idx = this.tracks.findIndex((t) => t.id === savedTrackId)
        if (idx !== -1) {
          this.currentIndex = idx
        }
      }
    })
  }

  private debouncedSaveVolume = debounce(() => {
    settings.set('volume', this.volume)
  }, 300)

  private debouncedSaveRecent = debounce(() => {
    putRecentTracks(this.recentTracks)
  }, 1000)

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
          putTracks([this.currentTrack])
        }
      })
    }

    audio.onError = () => {
      runInAction(() => {
        this.isPlaying = false
      })
    }
  }

  setActiveTab(tab: SideTab, sheetId?: string) {
    this.activeTab = tab
    this.listFilter = ''
    if (tab === 'favorite') {
      this.activeSheetId = FAVORITE_SHEET_ID
    } else if (sheetId) {
      this.activeSheetId = sheetId
    }
  }

  togglePlayQueue() {
    this.showPlayQueue = !this.showPlayQueue
  }

  get favoriteSheet(): MusicSheet | undefined {
    return this.sheets.find((s) => s.id === FAVORITE_SHEET_ID)
  }

  get customSheets(): MusicSheet[] {
    return this.sheets.filter((s) => s.id !== FAVORITE_SHEET_ID)
  }

  get trackMap(): Map<string, Track> {
    return new Map(this.tracks.map((t) => [t.id, t]))
  }

  get activeSheetTracks(): Track[] {
    const sheet = this.sheets.find((s) => s.id === this.activeSheetId)
    if (!sheet) return []
    const map = this.trackMap
    return sheet.trackIds.map((id) => map.get(id)).filter(Boolean) as Track[]
  }

  isTrackInFavorite(trackId: string): boolean {
    const fav = this.favoriteSheet
    return fav ? fav.trackIds.includes(trackId) : false
  }

  async toggleFavorite(trackId: string) {
    const fav = this.favoriteSheet
    if (!fav) return
    const newTrackIds = fav.trackIds.includes(trackId)
      ? fav.trackIds.filter((id) => id !== trackId)
      : [...fav.trackIds, trackId]
    const updated = { ...fav, trackIds: newTrackIds }
    this.sheets = this.sheets.map((s) => (s.id === fav.id ? updated : s))
    await putSheet(updated)
  }

  async addTrackToSheet(trackId: string, sheetId: string) {
    const sheet = this.sheets.find((s) => s.id === sheetId)
    if (!sheet || sheet.trackIds.includes(trackId)) return
    const updated = { ...sheet, trackIds: [...sheet.trackIds, trackId] }
    this.sheets = this.sheets.map((s) => (s.id === sheetId ? updated : s))
    await putSheet(updated)
  }

  async removeTrackFromSheet(trackId: string, sheetId: string) {
    const sheet = this.sheets.find((s) => s.id === sheetId)
    if (!sheet) return
    const updated = {
      ...sheet,
      trackIds: sheet.trackIds.filter((id) => id !== trackId),
    }
    this.sheets = this.sheets.map((s) => (s.id === sheetId ? updated : s))
    await putSheet(updated)
  }

  async createSheet(title: string) {
    const sheet: MusicSheet = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      trackIds: [],
      createdAt: Date.now(),
    }
    this.sheets.push(sheet)
    await putSheet(sheet)
    return sheet
  }

  async renameSheet(sheetId: string, title: string) {
    const sheet = this.sheets.find((s) => s.id === sheetId)
    if (!sheet) return
    const updated = { ...sheet, title }
    this.sheets = this.sheets.map((s) => (s.id === sheetId ? updated : s))
    await putSheet(updated)
  }

  async deleteSheet(sheetId: string) {
    if (sheetId === FAVORITE_SHEET_ID) return
    this.sheets = this.sheets.filter((s) => s.id !== sheetId)
    await dbRemoveSheet(sheetId)
    if (this.activeSheetId === sheetId) {
      this.activeTab = 'local'
      this.activeSheetId = ''
    }
  }

  get currentTrack(): Track | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.tracks.length) {
      return this.tracks[this.currentIndex]
    }
    return null
  }

  get filteredTracks(): Track[] {
    if (!this.listFilter) return this.tracks
    const q = this.listFilter.toLowerCase()
    return this.tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    )
  }

  get filteredRecentTracks(): RecentTrack[] {
    if (!this.listFilter) return this.recentTracks
    const q = this.listFilter.toLowerCase()
    return this.recentTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    )
  }

  get filteredSheetTracks(): Track[] {
    const tracks = this.activeSheetTracks
    if (!this.listFilter) return tracks
    const q = this.listFilter.toLowerCase()
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    )
  }

  setListFilter(query: string) {
    this.listFilter = query
  }

  private searchFileTask: tinker.SearchFileTask | null = null

  setSearchQuery(query: string) {
    this.searchQuery = query
    this.debouncedFileSearch(query)
  }

  private debouncedFileSearch = debounce((query: string) => {
    this.searchFiles(query)
  }, 300)

  private async searchFiles(query: string) {
    if (this.searchFileTask) {
      this.searchFileTask.kill()
      this.searchFileTask = null
    }

    if (!query.trim()) {
      runInAction(() => {
        this.fileSearchResults = []
        this.isSearchingFiles = false
      })
      return
    }

    runInAction(() => {
      this.isSearchingFiles = true
    })

    try {
      const task = tinker.searchFile(query, {
        exts: AUDIO_EXTS,
        maxResults: 20,
      })
      this.searchFileTask = task
      const results = await task
      runInAction(() => {
        this.fileSearchResults = results.map((r) => ({
          path: r.path,
          name: splitPath(r.path).name,
        }))
        this.isSearchingFiles = false
      })
    } catch {
      runInAction(() => {
        this.fileSearchResults = []
        this.isSearchingFiles = false
      })
    }
  }

  async addFromSearchResult(filePath: string) {
    const exists = this.tracks.some((t) => t.path === filePath)
    if (exists) return
    await this.addFiles([filePath])
    this.searchQuery = ''
    this.fileSearchResults = []
  }

  async addFiles(filePaths: string[]) {
    const newTracks: Track[] = []
    for (const filePath of filePaths) {
      if (this.tracks.some((t) => t.path === filePath)) continue
      const fileName = filePath.split('/').pop() || filePath
      const baseName = fileName.replace(/\.[^.]+$/, '')
      const track: Track = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: baseName,
        artist: '',
        album: '',
        duration: 0,
        path: filePath,
      }
      try {
        const info = await tinker.getMediaInfo(filePath)
        if (info.metadata?.title) track.title = info.metadata.title
        if (info.metadata?.artist) track.artist = info.metadata.artist
        if (info.metadata?.album) track.album = info.metadata.album
        if (info.duration) track.duration = info.duration
        if (info.audioStream?.cover) track.cover = info.audioStream.cover
      } catch {
        // Use filename as fallback
      }
      newTracks.push(track)
    }
    if (newTracks.length === 0) return
    runInAction(() => {
      this.tracks.push(...newTracks)
    })
    await putTracks(newTracks)

    if (
      (this.activeTab === 'favorite' || this.activeTab === 'sheet') &&
      this.activeSheetId
    ) {
      const sheet = this.sheets.find((s) => s.id === this.activeSheetId)
      if (sheet) {
        const newIds = newTracks
          .map((t) => t.id)
          .filter((id) => !sheet.trackIds.includes(id))
        if (newIds.length > 0) {
          const updated = {
            ...sheet,
            trackIds: [...sheet.trackIds, ...newIds],
          }
          this.sheets = this.sheets.map((s) =>
            s.id === this.activeSheetId ? updated : s
          )
          await putSheet(updated)
        }
      }
    }
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
    dbRemoveTrack(id)
  }

  async playTrack(index: number) {
    if (index < 0 || index >= this.tracks.length) return
    this.currentIndex = index
    const track = this.tracks[index]
    settings.set('currentTrackId', track.id)
    try {
      await audio.play(`file://${track.path}`)
      runInAction(() => {
        this.isPlaying = true
        const existIdx = this.recentTracks.findIndex((t) => t.id === track.id)
        if (existIdx !== -1) this.recentTracks.splice(existIdx, 1)
        this.recentTracks.unshift({ ...track, playedAt: Date.now() })
        if (this.recentTracks.length > MAX_RECENT) {
          this.recentTracks.length = MAX_RECENT
        }
      })
      this.debouncedSaveRecent()
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
    this.debouncedSaveVolume()
  }

  setPlayMode(mode: PlayMode) {
    this.playMode = mode
    settings.set('playMode', this.playMode)
  }

  cyclePlayMode() {
    const modes: PlayMode[] = ['sequence', 'loop', 'shuffle']
    const currentIdx = modes.indexOf(this.playMode)
    this.setPlayMode(modes[(currentIdx + 1) % modes.length])
  }
}

export default new Store()
