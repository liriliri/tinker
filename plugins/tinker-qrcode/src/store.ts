import { makeAutoObservable } from 'mobx'
import type { RefObject } from 'react'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import toast from 'react-hot-toast'
import i18n from './i18n'

const STORAGE_KEY_SIZE = 'size'
const STORAGE_KEY_FG_COLOR = 'fgColor'
const STORAGE_KEY_BG_COLOR = 'bgColor'
const STORAGE_KEY_IS_CUSTOM_SIZE = 'isCustomSize'
const STORAGE_KEY_CORRECT_LEVEL = 'correctLevel'
const storage = new LocalStore('tinker-qrcode')

const PRESET_SIZES = [300, 400, 500, 600]

class Store extends BaseStore {
  text: string = ''
  qrCodeDataURL: string = ''

  size: number = 300
  isCustomSize: boolean = false
  fgColor: string = '#000000'
  bgColor: string = '#ffffff'
  correctLevel: 'L' | 'M' | 'Q' | 'H' = 'M'

  canvasRef: RefObject<HTMLCanvasElement | null> | null = null

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
      // If not saved before, determine based on whether size is a preset value
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

    const savedCorrectLevel = storage.get(STORAGE_KEY_CORRECT_LEVEL)
    if (savedCorrectLevel && ['L', 'M', 'Q', 'H'].includes(savedCorrectLevel)) {
      this.correctLevel = savedCorrectLevel as 'L' | 'M' | 'Q' | 'H'
    }
  }

  setText(text: string) {
    this.text = text
  }

  setSize(size: number) {
    this.size = size
    storage.set(STORAGE_KEY_SIZE, String(size))
    // Automatically determine if it's a custom value when setting size
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

  setCorrectLevel(level: 'L' | 'M' | 'Q' | 'H') {
    this.correctLevel = level
    storage.set(STORAGE_KEY_CORRECT_LEVEL, level)
  }

  setQRCodeDataURL(dataURL: string) {
    this.qrCodeDataURL = dataURL
  }

  async copyQRCodeToClipboardWithToast() {
    try {
      if (!this.canvasRef?.current) {
        throw new Error('Canvas not ready')
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        this.canvasRef?.current?.toBlob(resolve, 'image/png')
      })

      if (!blob) {
        throw new Error('Failed to create image blob')
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      toast.success(i18n.t('copiedSuccess'))
    } catch (error) {
      console.error('Failed to copy QR code:', error)
      toast.error(i18n.t('copiedFailed'))
    }
  }
}

export default new Store()
