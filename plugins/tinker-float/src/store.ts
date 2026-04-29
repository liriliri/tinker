import { makeAutoObservable } from 'mobx'
import fileUrl from 'licia/fileUrl'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import {
  isImageUrl,
  isImageExtension,
  isVideoExtension,
  IMAGE_EXTENSIONS,
  TEXT_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from './lib/util'

const MIN_WINDOW_SIZE = {
  image: { width: 100, height: 100 },
  text: { width: 200, height: 100 },
  video: { width: 320, height: 240 },
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
    const width = storage.get('windowWidth') as number | undefined
    const height = storage.get('windowHeight') as number | undefined
    const alwaysOnTop = storage.get('alwaysOnTop') as boolean | undefined
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

  get effectiveHeight(): number {
    if (
      this.contentType === 'image' &&
      this.imageNaturalWidth > 0 &&
      this.imageNaturalHeight > 0
    ) {
      return Math.max(
        this.minWindowHeight,
        Math.round(
          this.windowWidth * (this.imageNaturalHeight / this.imageNaturalWidth)
        )
      )
    }
    return this.windowHeight
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

  setUrlSrc(url: string) {
    this.resetContent()
    this.contentType = 'url'
    this.urlSrc = url
    this.urlLoading = true
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
    if (isImageExtension(filePath)) {
      this.setImageSrc(fileUrl(filePath))
    } else if (isVideoExtension(filePath)) {
      this.setVideoSrc(fileUrl(filePath))
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
  }

  clearContent() {
    this.resetContent()
    this.contentType = 'text'
  }
}

export default new Store()
