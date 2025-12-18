import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import { ColorResult } from '@uiw/react-color'
import toast from 'react-hot-toast'
import LocalStore from 'licia/LocalStore'
import i18n from './i18n'
import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from './lib/util'

const STORAGE_KEY = 'current'
const storage = new LocalStore('tinker-color')

class Store extends BaseStore {
  // Current selected color
  currentColor: string = '#5a9020'

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  // Load color from storage
  private loadFromStorage() {
    const savedColor = storage.get(STORAGE_KEY)
    if (savedColor) {
      this.currentColor = savedColor
    }
  }

  // Update current color
  setColor(color: string) {
    this.currentColor = color
    storage.set(STORAGE_KEY, color)
  }

  // Handle color change from picker
  handleColorChange(color: ColorResult) {
    this.currentColor = color.hex
    storage.set(STORAGE_KEY, color.hex)
  }

  // Copy to clipboard with toast notification
  async copyToClipboardWithToast(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(i18n.t('copiedSuccess'))
    } catch (error) {
      toast.error(i18n.t('copiedFailed'))
    }
  }

  // Adjust saturation
  adjustSaturation(saturation: number) {
    const rgb = hexToRgb(this.currentColor)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const newRgb = hslToRgb(hsl.h, saturation, hsl.l)
    this.currentColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    storage.set(STORAGE_KEY, this.currentColor)
  }

  // Adjust lightness
  adjustLightness(lightness: number) {
    const rgb = hexToRgb(this.currentColor)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const newRgb = hslToRgb(hsl.h, hsl.s, lightness)
    this.currentColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    storage.set(STORAGE_KEY, this.currentColor)
  }

  // Get current HSL values
  getCurrentHsl() {
    const rgb = hexToRgb(this.currentColor)
    return rgbToHsl(rgb.r, rgb.g, rgb.b)
  }
}

const store = new Store()

export default store
