import { makeAutoObservable } from 'mobx'
import fileUrl from 'licia/fileUrl'
import BaseStore from 'share/BaseStore'
import { openImageFile } from 'share/lib/util'
import { isImageUrl } from './lib/util'

class Store extends BaseStore {
  contentType: 'image' | 'text' = 'text'
  textContent: string = ''
  imageDataUrl: string = ''
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
  }

  setImageSrc(src: string) {
    this.contentType = 'image'
    this.imageDataUrl = src
    this.textContent = ''
    this.imageNaturalWidth = 0
    this.imageNaturalHeight = 0
  }

  async openImage() {
    const result = await openImageFile()
    if (!result) return
    this.setImageSrc(fileUrl(result.filePath))
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
    this.imageNaturalWidth = 0
    this.imageNaturalHeight = 0
  }
}

export default new Store()
