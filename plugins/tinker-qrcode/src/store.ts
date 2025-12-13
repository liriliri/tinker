import { makeAutoObservable } from 'mobx'
import type { RefObject } from 'react'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  // QR Code data
  text: string = ''
  qrCodeDataURL: string = ''

  // QR Code options
  size: number = 100
  fgColor: string = '#000000'
  bgColor: string = '#ffffff'

  // Canvas ref for toolbar access
  canvasRef: RefObject<HTMLCanvasElement> | null = null

  constructor() {
    super()
    makeAutoObservable(this, {
      canvasRef: false, // Don't make canvasRef observable
    })
  }

  // QR Code text update
  setText(text: string) {
    this.text = text
  }

  // Update QR Code options
  setSize(size: number) {
    this.size = size
  }

  setFgColor(color: string) {
    this.fgColor = color
  }

  setBgColor(color: string) {
    this.bgColor = color
  }

  // Update QR Code data URL
  setQRCodeDataURL(dataURL: string) {
    this.qrCodeDataURL = dataURL
  }
}

const store = new Store()

export default store
