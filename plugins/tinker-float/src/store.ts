import { makeAutoObservable } from 'mobx'
import fileUrl from 'licia/fileUrl'
import isUrl from 'licia/isUrl'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { getFileCategory } from 'share/lib/util'
import {
  isImageUrl,
  IMAGE_EXTENSIONS,
  TEXT_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from './lib/util'

const MIN_WINDOW_SIZE = {
  image: { width: 100, height: 100 },
  text: { width: 200, height: 100 },
  video: { width: 320, height: 200 },
  url: { width: 320, height: 240 },
}

const storage = new LocalStore('tinker-float')

class Store extends BaseStore {
  contentType: 'image' | 'text' | 'video' | 'url' = 'text'
  textContent: string = ''
  imageDataUrl: string = ''
  videoSrc: string = ''
  urlSrc: string = ''
  urlLoading: boolean = false
  imageNaturalWidth: number = 0
  imageNaturalHeight: number = 0

  windowWidth: number = 400
  windowHeight: number = 300
  alwaysOnTop: boolean = true

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
  }

  private loadStorage() {
    const width = storage.get<number | undefined>('windowWidth')
    const height = storage.get<number | undefined>('windowHeight')
    const alwaysOnTop = storage.get<boolean | undefined>('alwaysOnTop')
    if (width != null) this.windowWidth = width
    if (height != null) this.windowHeight = height
    if (alwaysOnTop != null) this.alwaysOnTop = alwaysOnTop
  }

  get hasContent(): boolean {
    if (this.contentType === 'image') return this.imageDataUrl !== ''
    if (this.contentType === 'video') return this.videoSrc !== ''
    if (this.contentType === 'url') return this.urlSrc !== ''
    return this.textContent !== ''
  }

  get canFloat(): boolean {
    if (this.contentType === 'url') return this.hasContent && !this.urlLoading
    return this.hasContent
  }

  get minWindowWidth(): number {
    return MIN_WINDOW_SIZE[this.contentType].width
  }

  get minWindowHeight(): number {
    return MIN_WINDOW_SIZE[this.contentType].height
  }

  private applyAspectRatio(naturalWidth: number, naturalHeight: number) {
    if (naturalWidth > 0 && naturalHeight > 0) {
      const h = Math.max(
        this.minWindowHeight,
        Math.round(this.windowWidth * (naturalHeight / naturalWidth))
      )
      this.setWindowHeight(h)
    }
  }

  private resetContent() {
    this.textContent = ''
    this.imageDataUrl = ''
    this.videoSrc = ''
    this.urlSrc = ''
    this.urlLoading = false
    this.imageNaturalWidth = 0
    this.imageNaturalHeight = 0
  }

  setTextContent(text: string) {
    this.resetContent()
    if (isImageUrl(text)) {
      this.contentType = 'image'
      this.imageDataUrl = text
    } else {
      this.contentType = 'text'
      this.textContent = text
    }
  }

  setImageSrc(src: string) {
    this.resetContent()
    this.contentType = 'image'
    this.imageDataUrl = src
  }

  setVideoSrc(src: string) {
    this.resetContent()
    this.contentType = 'video'
    this.videoSrc = src
  }

  async loadVideoInfo(filePath: string) {
    try {
      const info = await tinker.getMediaInfo(filePath)
      if (info.videoStream) {
        this.applyAspectRatio(info.videoStream.width, info.videoStream.height)
      }
    } catch {
      // ignore, will use default size
    }
  }

  setUrlSrc(url: string): boolean {
    if (!isUrl(url)) return false
    this.resetContent()
    this.contentType = 'url'
    this.urlSrc = url
    this.urlLoading = true
    return true
  }

  setUrlLoading(v: boolean) {
    this.urlLoading = v
  }

  async openFile() {
    const result = await tinker.showOpenDialog({
      title: 'Open File',
      filters: [
        {
          name: 'All Supported',
          extensions: [
            ...IMAGE_EXTENSIONS,
            ...TEXT_EXTENSIONS,
            ...VIDEO_EXTENSIONS,
          ],
        },
        { name: 'Images', extensions: IMAGE_EXTENSIONS },
        { name: 'Video', extensions: VIDEO_EXTENSIONS },
        { name: 'Text', extensions: TEXT_EXTENSIONS },
      ],
      properties: ['openFile'],
    })

    if (result.canceled || !result.filePaths[0]) return

    const filePath = result.filePaths[0]
    const category = getFileCategory(filePath)
    if (category === 'image') {
      this.setImageSrc(fileUrl(filePath))
    } else if (category === 'video') {
      this.setVideoSrc(fileUrl(filePath))
      await this.loadVideoInfo(filePath)
    } else {
      try {
        const buffer = await tinker.readFile(filePath)
        const text = new TextDecoder().decode(buffer)
        this.setTextContent(text)
      } catch (error) {
        console.error('Failed to read text file:', error)
      }
    }
  }

  async captureScreen() {
    const dataUrl = await tinker.captureScreen()
    if (!dataUrl) return
    this.setImageSrc(dataUrl)
  }

  setWindowWidth(w: number) {
    this.windowWidth = Math.max(this.minWindowWidth, w)
    storage.set('windowWidth', this.windowWidth)
  }

  setWindowHeight(h: number) {
    this.windowHeight = Math.max(this.minWindowHeight, h)
    storage.set('windowHeight', this.windowHeight)
  }

  setAlwaysOnTop(v: boolean) {
    this.alwaysOnTop = v
    storage.set('alwaysOnTop', v)
  }

  setImageNaturalSize(w: number, h: number) {
    this.imageNaturalWidth = w
    this.imageNaturalHeight = h
    this.applyAspectRatio(w, h)
  }

  clearContent() {
    this.resetContent()
    this.contentType = 'text'
  }
}

export default new Store()
