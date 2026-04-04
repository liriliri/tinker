import { makeAutoObservable } from 'mobx'
import fileUrl from 'licia/fileUrl'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  videoSrc = ''

  constructor() {
    super()
    makeAutoObservable(this)
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
      this.setVideoSrc(fileUrl(result.filePaths[0]))
    }
  }
}

export default new Store()
