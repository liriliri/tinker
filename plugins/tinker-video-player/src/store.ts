import { makeAutoObservable } from 'mobx'
import fileUrl from 'licia/fileUrl'
import splitPath from 'licia/splitPath'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

interface HistoryItem {
  filePath: string
  name: string
}

const HISTORY_KEY = 'history'
const storage = new LocalStore('tinker-video-player')

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

  private loadHistory() {
    const history = storage.get(HISTORY_KEY)
    if (Array.isArray(history)) {
      this.playHistory = history
    }
  }

  private saveHistory() {
    storage.set(HISTORY_KEY, this.playHistory.slice())
  }

  setVideo(filePath: string) {
    this.filePath = filePath
    this.videoSrc = fileUrl(filePath)

    const { name, ext } = splitPath(filePath)
    const displayName = name.replace(ext, '')
    tinker.setTitle(displayName)

    this.addToHistory({ filePath, name: displayName })
  }

  private addToHistory(item: HistoryItem) {
    this.playHistory = [
      item,
      ...this.playHistory.filter((h) => h.filePath !== item.filePath),
    ]
    this.saveHistory()
  }

  removeFromHistory(filePath: string) {
    this.playHistory = this.playHistory.filter((h) => h.filePath !== filePath)
    this.saveHistory()
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
