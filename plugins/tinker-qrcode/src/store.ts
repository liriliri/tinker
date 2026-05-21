import { makeAutoObservable } from 'mobx'
import type { RefObject } from 'react'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import toast from 'react-hot-toast'
import i18n from 'i18next'

const STORAGE_SIZE = 'size'
const STORAGE_FG_COLOR = 'fgColor'
const STORAGE_BG_COLOR = 'bgColor'
const STORAGE_IS_CUSTOM_SIZE = 'isCustomSize'
const STORAGE_CORRECT_LEVEL = 'correctLevel'
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
  iconDataUrl: string = ''

  scanResult: string = ''
  isScanResultOpen: boolean = false

  canvasRef: RefObject<HTMLCanvasElement | null> | null = null

  constructor() {
    super()
    makeAutoObservable(this, {
      canvasRef: false,
    })
    this.loadStorage()
  }

  loadStorage() {
    const savedSize = storage.get<string | number | undefined>(STORAGE_SIZE)
    if (savedSize) {
      const size = Number(savedSize)
      if (!isNaN(size) && size >= 100 && size <= 2000) {
        this.size = size
      }
    }

    const savedIsCustomSize = storage.get<string | undefined>(
      STORAGE_IS_CUSTOM_SIZE
    )
    if (savedIsCustomSize !== undefined) {
      this.isCustomSize = savedIsCustomSize === 'true'
    } else {
      this.isCustomSize = !PRESET_SIZES.includes(this.size)
    }

    const savedFgColor = storage.get<string | undefined>(STORAGE_FG_COLOR)
    if (savedFgColor) {
      this.fgColor = savedFgColor
    }

    const savedBgColor = storage.get<string | undefined>(STORAGE_BG_COLOR)
    if (savedBgColor) {
      this.bgColor = savedBgColor
    }

    const savedCorrectLevel = storage.get<Store['correctLevel'] | undefined>(
      STORAGE_CORRECT_LEVEL
    )
    if (savedCorrectLevel && ['L', 'M', 'Q', 'H'].includes(savedCorrectLevel)) {
      this.correctLevel = savedCorrectLevel
    }
  }

  setText(text: string) {
    this.text = text
  }

  setSize(size: number) {
    this.size = size
    storage.set(STORAGE_SIZE, String(size))
    const wasCustom = this.isCustomSize
    this.isCustomSize = !PRESET_SIZES.includes(size)
    if (wasCustom !== this.isCustomSize) {
      storage.set(STORAGE_IS_CUSTOM_SIZE, String(this.isCustomSize))
    }
  }

  setIsCustomSize(isCustom: boolean) {
    this.isCustomSize = isCustom
    storage.set(STORAGE_IS_CUSTOM_SIZE, String(isCustom))
  }

  setFgColor(color: string) {
    this.fgColor = color
    storage.set(STORAGE_FG_COLOR, color)
  }

  setBgColor(color: string) {
    this.bgColor = color
    storage.set(STORAGE_BG_COLOR, color)
  }

  setCorrectLevel(level: 'L' | 'M' | 'Q' | 'H') {
    this.correctLevel = level
    storage.set(STORAGE_CORRECT_LEVEL, level)
  }

  setIcon(dataUrl: string) {
    this.iconDataUrl = dataUrl
  }

  clearIcon() {
    this.iconDataUrl = ''
  }

  setQRCodeDataURL(dataURL: string) {
    this.qrCodeDataURL = dataURL
  }

  openScanResult(result: string) {
    this.scanResult = result
    this.isScanResultOpen = true
  }

  closeScanResult() {
    this.isScanResultOpen = false
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
