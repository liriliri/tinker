import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import LocalStore from 'licia/LocalStore'
import randomItem from 'licia/randomItem'
import debounce from 'licia/debounce'
import splitPath from 'licia/splitPath'
import uuid from 'licia/uuid'
import audio from './lib/audio'
import {
  LyricLine,
  parseLrc,
  loadLrcForPath,
  findCurrentLine,
} from './lib/lyric'
import {
  Track,
  RecentTrack,
  MusicSheet,
  getAllTracks,
  putTracks,
  removeTrack as dbRemoveTrack,
  getRecentTracks,
  putRecentTracks,
  addRecentTrack,
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

const storage = new LocalStore('tinker-music-player')

const STORAGE_VOLUME = 'volume'
const STORAGE_PLAY_MODE = 'playMode'
const STORAGE_CURRENT_TRACK_ID = 'currentTrackId'
const STORAGE_PLAY_QUEUE_IDS = 'playQueueIds'

class Store extends BaseStore {
  tracks: Track[] = []
  recentTracks: RecentTrack[] = []
  sheets: MusicSheet[] = []
  playQueue: Track[] = []
  activeTab: SideTab = 'local'
  activeSheetId: string = ''
  currentIndex: number = -1
  isPlaying: boolean = false
  showPlayQueue: boolean = false
  addToSheetTrackId: string = ''
  currentTime: number = 0
  duration: number = 0
  volume: number = 0.8
  playMode: PlayMode = 'sequence'
  searchQuery: string = ''
  listFilter: string = ''
  fileSearchResults: FileSearchResult[] = []
  isSearchingFiles: boolean = false
  showMusicDetail: boolean = false
  lyricLines: LyricLine[] = []
  miniModeWindow: Window | null = null
  floatLyricWindow: Window | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
    this.loadDb()
    this.setupAudio()
  }

  private loadStorage() {
    this.volume = storage.get<number>(STORAGE_VOLUME) ?? 0.8
    this.playMode = storage.get<PlayMode>(STORAGE_PLAY_MODE) || 'sequence'
    audio.setVolume(this.volume)
  }

  private async loadDb() {
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

      const savedTrackId = storage.get<string>(STORAGE_CURRENT_TRACK_ID)
      const savedQueueIds = storage.get<string[]>(STORAGE_PLAY_QUEUE_IDS) || []
      if (savedQueueIds.length > 0) {
        const trackMap = this.trackMap
        this.playQueue = savedQueueIds
          .map((id) => trackMap.get(id))
          .filter(Boolean) as Track[]
        if (savedTrackId) {
          const idx = this.playQueue.findIndex((t) => t.id === savedTrackId)
          if (idx !== -1) {
            this.currentIndex = idx
            this.loadLyrics(this.playQueue[idx])
          }
        }
      } else if (savedTrackId) {
        const track = this.tracks.find((t) => t.id === savedTrackId)
        if (track) {
          this.playQueue = [track]
          this.currentIndex = 0
          this.loadLyrics(track)
        }
      }
    })
  }

  private debouncedSaveVolume = debounce(() => {
    storage.set(STORAGE_VOLUME, this.volume)
  }, 300)

  private saveQueue() {
    storage.set(
      STORAGE_PLAY_QUEUE_IDS,
      this.playQueue.map((t) => t.id)
    )
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
          putTracks([this.currentTrack])
        }
      })
    }

    audio.onError = () => {
      runInAction(() => {
        this.isPlaying = false
      })
    }

    audio.onPlay = () => {
      runInAction(() => {
        this.isPlaying = true
      })
    }

    audio.onPause = () => {
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

  showAddToSheet(trackId: string) {
    this.addToSheetTrackId = trackId
  }

  hideAddToSheet() {
    this.addToSheetTrackId = ''
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
      id: uuid(),
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
    if (this.currentIndex >= 0 && this.currentIndex < this.playQueue.length) {
      return this.playQueue[this.currentIndex]
    }
    return null
  }

  get currentLyricText(): string {
    const idx = findCurrentLine(this.lyricLines, this.currentTime)
    if (idx >= 0) {
      return this.lyricLines[idx].text
    }
    return ''
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
    const existing = this.tracks.find((t) => t.path === filePath)
    if (existing) {
      const index = this.tracks.indexOf(existing)
      this.searchQuery = ''
      this.fileSearchResults = []
      await this.playTrack(index)
      return
    }

    const savedTab = this.activeTab
    const savedSheetId = this.activeSheetId
    this.activeTab = 'local'
    this.activeSheetId = ''
    await this.addFiles([filePath])
    runInAction(() => {
      this.activeTab = savedTab
      this.activeSheetId = savedSheetId
      this.searchQuery = ''
      this.fileSearchResults = []
    })

    const newTrack = this.tracks.find((t) => t.path === filePath)
    if (newTrack) {
      const index = this.tracks.indexOf(newTrack)
      await this.playTrack(index)
    }
  }

  async addFiles(filePaths: string[]) {
    const newTracks: Track[] = []
    for (const filePath of filePaths) {
      if (this.tracks.some((t) => t.path === filePath)) continue
      const baseName = splitPath(filePath).name
      const track: Track = {
        id: uuid(),
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
    this.tracks.splice(index, 1)
    dbRemoveTrack(id)

    // Remove from play queue
    const queueIdx = this.playQueue.findIndex((t) => t.id === id)
    if (queueIdx !== -1) {
      if (queueIdx === this.currentIndex) {
        audio.pause()
        this.currentIndex = -1
      } else if (queueIdx < this.currentIndex) {
        this.currentIndex--
      }
      this.playQueue.splice(queueIdx, 1)
      this.saveQueue()
    }

    // Remove from all sheets
    for (const sheet of this.sheets) {
      if (sheet.trackIds.includes(id)) {
        const updated = {
          ...sheet,
          trackIds: sheet.trackIds.filter((tid) => tid !== id),
        }
        this.sheets = this.sheets.map((s) => (s.id === sheet.id ? updated : s))
        putSheet(updated)
      }
    }

    // Remove from recent tracks
    const recentIdx = this.recentTracks.findIndex((t) => t.id === id)
    if (recentIdx !== -1) {
      this.recentTracks.splice(recentIdx, 1)
      putRecentTracks(this.recentTracks)
    }
  }

  removeFromQueue(id: string) {
    const queueIdx = this.playQueue.findIndex((t) => t.id === id)
    if (queueIdx === -1) return
    if (queueIdx === this.currentIndex) {
      audio.pause()
      this.currentIndex = -1
    } else if (queueIdx < this.currentIndex) {
      this.currentIndex--
    }
    this.playQueue.splice(queueIdx, 1)
    this.saveQueue()
  }

  clearPlayQueue() {
    audio.stop()
    this.currentIndex = -1
    this.currentTime = 0
    this.duration = 0
    this.playQueue = []
    this.showPlayQueue = false
    storage.set(STORAGE_CURRENT_TRACK_ID, '')
    this.saveQueue()
  }

  async playAll(tracks: Track[]) {
    if (tracks.length === 0) return
    this.playQueue = [...tracks]
    this.currentIndex = 0
    this.saveQueue()
    await this.startPlayback(tracks[0])
  }

  async playTrack(index: number) {
    if (index < 0 || index >= this.tracks.length) return
    const track = this.tracks[index]
    const queueIdx = this.playQueue.findIndex((t) => t.id === track.id)
    if (queueIdx !== -1) {
      this.currentIndex = queueIdx
    } else {
      this.playQueue.push(track)
      this.currentIndex = this.playQueue.length - 1
      this.saveQueue()
    }
    await this.startPlayback(track)
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
    } else {
      try {
        if (audio.paused && !audio.duration) {
          const track = this.currentTrack
          if (track) {
            await audio.play(`file://${track.path}`)
          }
        } else {
          await audio.play()
        }
      } catch {
        // error handled by audio.onError
      }
    }
  }

  async playNext() {
    if (this.playQueue.length === 0) return
    let nextIndex: number
    if (this.playMode === 'loop') {
      nextIndex = this.currentIndex
    } else if (this.playMode === 'shuffle') {
      const otherTracks = this.playQueue.filter(
        (_, i) => i !== this.currentIndex
      )
      if (otherTracks.length === 0) {
        nextIndex = this.currentIndex
      } else {
        const picked = randomItem(otherTracks)
        nextIndex = this.playQueue.indexOf(picked)
      }
    } else {
      nextIndex = (this.currentIndex + 1) % this.playQueue.length
    }
    await this.playQueueAt(nextIndex)
  }

  async playPrev() {
    if (this.playQueue.length === 0) return
    if (this.currentTime > 3) {
      this.seek(0)
      return
    }
    const prevIndex =
      (this.currentIndex - 1 + this.playQueue.length) % this.playQueue.length
    await this.playQueueAt(prevIndex)
  }

  async playQueueAt(index: number) {
    if (index < 0 || index >= this.playQueue.length) return
    const track = this.playQueue[index]
    this.currentIndex = index
    await this.startPlayback(track)
  }

  private async startPlayback(track: Track) {
    storage.set(STORAGE_CURRENT_TRACK_ID, track.id)
    this.loadLyrics(track)
    try {
      await audio.play(`file://${track.path}`)
      runInAction(() => {
        const existIdx = this.recentTracks.findIndex((t) => t.id === track.id)
        if (existIdx !== -1) this.recentTracks.splice(existIdx, 1)
        this.recentTracks.unshift({ ...track, playedAt: Date.now() })
        if (this.recentTracks.length > MAX_RECENT) {
          this.recentTracks.length = MAX_RECENT
        }
      })
      addRecentTrack(track)
    } catch {
      // error handled by audio.onError
    }
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
    storage.set(STORAGE_PLAY_MODE, this.playMode)
  }

  cyclePlayMode() {
    const modes: PlayMode[] = ['sequence', 'loop', 'shuffle']
    const currentIdx = modes.indexOf(this.playMode)
    this.setPlayMode(modes[(currentIdx + 1) % modes.length])
  }

  showMusicDetailView() {
    this.showMusicDetail = true
  }

  hideMusicDetail() {
    this.showMusicDetail = false
  }

  private async loadLyrics(track: Track) {
    const lrcText = await loadLrcForPath(track.path)
    runInAction(() => {
      this.lyricLines = lrcText ? parseLrc(lrcText) : []
    })
  }
}

export default new Store()
