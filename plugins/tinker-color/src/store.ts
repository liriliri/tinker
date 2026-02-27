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
  currentColor: string = '#5a9020'
  alpha: number = 100

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  private loadFromStorage() {
    const savedColor = storage.get(STORAGE_KEY)
    if (savedColor) {
      this.currentColor = savedColor
    }
    const savedAlpha = storage.get('alpha')
    if (savedAlpha !== undefined) {
      this.alpha = savedAlpha
    }
  }

  setColor(color: string) {
    this.currentColor = color
    storage.set(STORAGE_KEY, color)
  }

  handleColorChange(color: ColorResult) {
    this.currentColor = color.hex
    storage.set(STORAGE_KEY, color.hex)
  }

  setAlpha(alpha: number) {
    this.alpha = alpha
    storage.set('alpha', alpha)
  }

  async copyToClipboardWithToast(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(i18n.t('copiedSuccess'))
    } catch {
      toast.error(i18n.t('copiedFailed'))
    }
  }

  adjustSaturation(saturation: number) {
    const rgb = hexToRgb(this.currentColor)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const newRgb = hslToRgb(hsl.h, saturation, hsl.l)
    this.currentColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    storage.set(STORAGE_KEY, this.currentColor)
  }

  adjustLightness(lightness: number) {
    const rgb = hexToRgb(this.currentColor)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const newRgb = hslToRgb(hsl.h, hsl.s, lightness)
    this.currentColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    storage.set(STORAGE_KEY, this.currentColor)
  }

  getCurrentHsl() {
    const rgb = hexToRgb(this.currentColor)
    return rgbToHsl(rgb.r, rgb.g, rgb.b)
  }
}

const store = new Store()

export default store
