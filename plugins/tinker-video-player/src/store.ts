import { makeAutoObservable } from 'mobx'
import fileUrl from 'licia/fileUrl'
import splitPath from 'licia/splitPath'
import BaseStore from 'share/BaseStore'
import * as db from './lib/db'
import { HistoryItem } from './types'

class Store extends BaseStore {
  videoSrc = ''
  filePath = ''
  mediaInfo: tinker.MediaInfo | null = null
  showMediaInfo = false
  showPlaylist = false
  playHistory: HistoryItem[] = []

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadHistory()
  }

  private async loadHistory() {
    try {
      const history = await db.getAllHistory()
      this.playHistory = history
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  async setVideo(filePath: string) {
    this.filePath = filePath
    this.videoSrc = fileUrl(filePath)

    const { name, ext } = splitPath(filePath)
    const displayName = name.replace(ext, '')
    tinker.setTitle(displayName)

    await this.addToHistory(filePath, displayName)
  }

  private async addToHistory(filePath: string, name: string) {
    const existing = this.playHistory.find((h) => h.filePath === filePath)

    const item: HistoryItem = {
      filePath,
      name,
      thumbnail: existing?.thumbnail,
      duration: existing?.duration,
      currentTime: existing?.currentTime,
      lastPlayed: Date.now(),
    }

    this.playHistory = [
      item,
      ...this.playHistory.filter((h) => h.filePath !== filePath),
    ]
    db.putHistory(item)

    // Fetch thumbnail in background if not cached
    if (!item.thumbnail) {
      this.fetchThumbnail(filePath)
    }
  }

  private async fetchThumbnail(filePath: string) {
    try {
      const info = await tinker.getMediaInfo(filePath)
      const idx = this.playHistory.findIndex((h) => h.filePath === filePath)
      if (idx === -1) return

      const updated: HistoryItem = {
        ...this.playHistory[idx],
        thumbnail: info.videoStream?.thumbnail,
        duration: info.duration,
      }
      this.playHistory = this.playHistory.map((h) =>
        h.filePath === filePath ? updated : h
      )
      db.putHistory(updated)
    } catch {
      // ignore - file may not be accessible
    }
  }

  async removeFromHistory(filePath: string) {
    this.playHistory = this.playHistory.filter((h) => h.filePath !== filePath)
    await db.removeHistory(filePath)
  }

  async clearHistory() {
    this.playHistory = []
    await db.clearHistory()
  }

  setVideoSrc(src: string) {
    this.videoSrc = src
  }

  get hasVideo() {
    return this.videoSrc !== ''
  }

  togglePlaylist() {
    this.showPlaylist = !this.showPlaylist
  }

  closePlaylist() {
    this.showPlaylist = false
  }

  saveProgress(currentTime: number) {
    const item = this.playHistory.find((h) => h.filePath === this.filePath)
    if (!item) return
    if (
      item.currentTime !== undefined &&
      Math.abs(currentTime - item.currentTime) < 1
    )
      return

    const updated: HistoryItem = { ...item, currentTime }
    this.playHistory = this.playHistory.map((h) =>
      h.filePath === this.filePath ? updated : h
    )
    db.putHistory(updated)
  }

  getSavedProgress(filePath: string): number {
    const item = this.playHistory.find((h) => h.filePath === filePath)
    return item?.currentTime ?? 0
  }

  async openFile() {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Video',
          extensions: ['mp4', 'webm', 'ogv', 'ogg', 'mov', 'avi', 'mkv', 'm4v'],
        },
      ],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      this.setVideo(result.filePaths[0])
    }
  }

  async fetchMediaInfo() {
    if (!this.filePath) return
    this.mediaInfo = await tinker.getMediaInfo(this.filePath)
    this.showMediaInfo = true
  }

  closeMediaInfo() {
    this.showMediaInfo = false
  }
}

export default new Store()
