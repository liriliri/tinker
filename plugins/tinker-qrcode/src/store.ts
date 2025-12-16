import { makeAutoObservable } from 'mobx'
import type { RefObject } from 'react'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

const STORAGE_KEY_SIZE = 'size'
const STORAGE_KEY_FG_COLOR = 'fgColor'
const STORAGE_KEY_BG_COLOR = 'bgColor'
const STORAGE_KEY_IS_CUSTOM_SIZE = 'isCustomSize'
const storage = new LocalStore('tinker-qrcode')

const PRESET_SIZES = [300, 400, 500, 600]

class Store extends BaseStore {
  // QR Code data
  text: string = ''
  qrCodeDataURL: string = ''

  // QR Code options
  size: number = 300
  isCustomSize: boolean = false
  fgColor: string = '#000000'
  bgColor: string = '#ffffff'

  // Canvas ref for toolbar access
  canvasRef: RefObject<HTMLCanvasElement> | null = null

  constructor() {
    super()
    makeAutoObservable(this, {
      canvasRef: false, // Don't make canvasRef observable
    })
    this.loadSettings()
  }

  loadSettings() {
    const savedSize = storage.get(STORAGE_KEY_SIZE)
    if (savedSize) {
      const size = Number(savedSize)
      if (!isNaN(size) && size >= 100 && size <= 2000) {
        this.size = size
      }
    }

    const savedIsCustomSize = storage.get(STORAGE_KEY_IS_CUSTOM_SIZE)
    if (savedIsCustomSize !== null) {
      this.isCustomSize = savedIsCustomSize === 'true'
    } else {
      // 如果没有保存过，根据 size 是否是预设值来判断
      this.isCustomSize = !PRESET_SIZES.includes(this.size)
    }

    const savedFgColor = storage.get(STORAGE_KEY_FG_COLOR)
    if (savedFgColor) {
      this.fgColor = savedFgColor
    }

    const savedBgColor = storage.get(STORAGE_KEY_BG_COLOR)
    if (savedBgColor) {
      this.bgColor = savedBgColor
    }
  }

  // QR Code text update
  setText(text: string) {
    this.text = text
  }

  // Update QR Code options
  setSize(size: number) {
    this.size = size
    storage.set(STORAGE_KEY_SIZE, String(size))
    // 当设置 size 时，自动判断是否是自定义值
    const wasCustom = this.isCustomSize
    this.isCustomSize = !PRESET_SIZES.includes(size)
    if (wasCustom !== this.isCustomSize) {
      storage.set(STORAGE_KEY_IS_CUSTOM_SIZE, String(this.isCustomSize))
    }
  }

  setIsCustomSize(isCustom: boolean) {
    this.isCustomSize = isCustom
    storage.set(STORAGE_KEY_IS_CUSTOM_SIZE, String(isCustom))
  }

  setFgColor(color: string) {
    this.fgColor = color
    storage.set(STORAGE_KEY_FG_COLOR, color)
  }

  setBgColor(color: string) {
    this.bgColor = color
    storage.set(STORAGE_KEY_BG_COLOR, color)
  }

  // Update QR Code data URL
  setQRCodeDataURL(dataURL: string) {
    this.qrCodeDataURL = dataURL
  }
}

export default new Store()
