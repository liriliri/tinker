import { makeAutoObservable } from 'mobx'
import fileUrl from 'licia/fileUrl'
import BaseStore from 'share/BaseStore'
import {
  isImageUrl,
  isImageExtension,
  isVideoExtension,
  IMAGE_EXTENSIONS,
  TEXT_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from './lib/util'

class Store extends BaseStore {
  contentType: 'image' | 'text' | 'video' = 'text'
  textContent: string = ''
  imageDataUrl: string = ''
  videoSrc: string = ''
  imageNaturalWidth: number = 0
  imageNaturalHeight: number = 0

  windowWidth: number = 400
  windowHeight: number = 300
  alwaysOnTop: boolean = true

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get hasContent(): boolean {
    if (this.contentType === 'image') return this.imageDataUrl !== ''
    if (this.contentType === 'video') return this.videoSrc !== ''
    return this.textContent !== ''
  }

  get effectiveHeight(): number {
    if (
      this.contentType === 'image' &&
      this.imageNaturalWidth > 0 &&
      this.imageNaturalHeight > 0
    ) {
      return Math.round(
        this.windowWidth * (this.imageNaturalHeight / this.imageNaturalWidth)
      )
    }
    return this.windowHeight
  }

  setTextContent(text: string) {
    if (isImageUrl(text)) {
      this.contentType = 'image'
      this.imageDataUrl = text
      this.textContent = ''
    } else {
      this.contentType = 'text'
      this.textContent = text
      this.imageDataUrl = ''
      this.imageNaturalWidth = 0
      this.imageNaturalHeight = 0
    }
    this.videoSrc = ''
  }

  setImageSrc(src: string) {
    this.contentType = 'image'
    this.imageDataUrl = src
    this.textContent = ''
    this.videoSrc = ''
    this.imageNaturalWidth = 0
    this.imageNaturalHeight = 0
  }

  setVideoSrc(src: string) {
    this.contentType = 'video'
    this.videoSrc = src
    this.textContent = ''
    this.imageDataUrl = ''
    this.imageNaturalWidth = 0
    this.imageNaturalHeight = 0
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
    this.windowWidth = Math.max(100, w)
  }

  setWindowHeight(h: number) {
    this.windowHeight = Math.max(100, h)
  }

  setAlwaysOnTop(v: boolean) {
    this.alwaysOnTop = v
  }

  setImageNaturalSize(w: number, h: number) {
    this.imageNaturalWidth = w
    this.imageNaturalHeight = h
  }

  clearContent() {
    this.contentType = 'text'
    this.textContent = ''
    this.imageDataUrl = ''
    this.videoSrc = ''
    this.imageNaturalWidth = 0
    this.imageNaturalHeight = 0
  }
}

export default new Store()
