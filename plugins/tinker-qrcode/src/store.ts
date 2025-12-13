import { makeAutoObservable } from 'mobx'
import type { RefObject } from 'react'

class Store {
  // UI state
  isDark: boolean = false

  // QR Code data
  text: string = ''
  qrCodeDataURL: string = ''

  // QR Code options
  size: number = 256
  fgColor: string = '#000000'
  bgColor: string = '#ffffff'

  // Canvas ref for toolbar access
  canvasRef: RefObject<HTMLCanvasElement> | null = null

  constructor() {
    makeAutoObservable(this, {
      canvasRef: false, // Don't make canvasRef observable
    })
    this.initTheme()
  }

  private async initTheme() {
    try {
      const theme = await tinker.getTheme()
      this.isDark = theme === 'dark'

      // Listen for theme changes
      tinker.on('changeTheme', async () => {
        const newTheme = await tinker.getTheme()
        this.isDark = newTheme === 'dark'
      })
    } catch (err) {
      console.error('Failed to initialize theme:', err)
    }
  }

  private loadSavedData() {
    // Not used in QR Code plugin
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
