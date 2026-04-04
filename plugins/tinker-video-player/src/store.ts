import { makeAutoObservable } from 'mobx'
import fileUrl from 'licia/fileUrl'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  videoSrc = ''
  filePath = ''
  mediaInfo: tinker.MediaInfo | null = null
  showMediaInfo = false

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setVideo(filePath: string) {
    this.filePath = filePath
    this.videoSrc = fileUrl(filePath)
  }

  setVideoSrc(src: string) {
    this.videoSrc = src
  }

  get hasVideo() {
    return this.videoSrc !== ''
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
