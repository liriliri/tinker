import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import download from 'licia/download'
import toast from 'react-hot-toast'
import BaseStore from 'share/BaseStore'
import { alert } from 'share/components/Alert'
import { THEME_COLORS } from 'share/theme'
import i18n from './i18n'
import type { App } from 'leafer-ui'

export type ToolType = 'select' | 'rect' | 'ellipse' | 'line' | 'pen' | 'text'

const STORAGE_FOREGROUND_KEY = 'foreground-color'
const STORAGE_BACKGROUND_KEY = 'background-color'
const STORAGE_TOOL_KEY = 'tool'
const storage = new LocalStore('tinker-image-annotator')
const DEFAULT_FOREGROUND_COLOR = THEME_COLORS.text.light.primary
const DEFAULT_BACKGROUND_COLOR = THEME_COLORS.bg.light.primary

export interface ImageInfo {
  fileName: string
  filePath?: string
  url: string
  width: number
  height: number
}

class Store extends BaseStore {
  app: App | null = null
  image: ImageInfo | null = null
  isLoading: boolean = false
  scale: number = 100
  tool: ToolType = 'select'
  strokeWidth: number = 4
  foregroundColor: string = DEFAULT_FOREGROUND_COLOR
  backgroundColor: string = DEFAULT_BACKGROUND_COLOR
  fontSize: number = 28

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadToolFromStorage()
    this.loadColorsFromStorage()
  }

  get hasImage() {
    return !!this.image
  }

  setApp(app: App | null) {
    this.app = app
  }

  setScale(scale: number) {
    this.scale = Math.round(scale * 100)
  }

  setTool(tool: ToolType) {
    this.tool = tool
    this.syncEditorMode()
    storage.set(STORAGE_TOOL_KEY, tool)
  }

  setForegroundColor(color: string) {
    this.foregroundColor = color
    storage.set(STORAGE_FOREGROUND_KEY, color)
  }

  setBackgroundColor(color: string) {
    this.backgroundColor = color
    storage.set(STORAGE_BACKGROUND_KEY, color)
  }

  swapColors() {
    const nextForeground = this.backgroundColor
    const nextBackground = this.foregroundColor
    this.foregroundColor = nextForeground
    this.backgroundColor = nextBackground
    storage.set(STORAGE_FOREGROUND_KEY, nextForeground)
    storage.set(STORAGE_BACKGROUND_KEY, nextBackground)
  }

  setStrokeWidth(value: number) {
    this.strokeWidth = value
  }

  setFontSize(value: number) {
    this.fontSize = value
  }

  syncEditorMode() {
    if (!this.app?.editor) return
    this.app.editor.hittable = this.tool === 'select'
  }

  async loadImage(file: File, filePath?: string) {
    try {
      this.isLoading = true

      const img = new Image()
      const url = URL.createObjectURL(file)

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load image'))
        }
        img.src = url
      })

      if (this.image?.url) {
        URL.revokeObjectURL(this.image.url)
      }

      runInAction(() => {
        this.image = {
          fileName: file.name,
          filePath,
          url,
          width: img.width,
          height: img.height,
        }
      })
    } catch (error) {
      console.error('Failed to load image:', error)
      alert({ title: i18n.t('loadImageError') as string })
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  clearImage() {
    if (this.image?.url) {
      URL.revokeObjectURL(this.image.url)
    }
    this.image = null
    this.setTool('select')
  }

  clearAnnotations() {
    if (!this.app?.tree) return
    this.app.tree.children.forEach((child) => {
      if (child.id !== 'base-image') {
        child.remove()
      }
    })
  }

  async saveToFile() {
    if (!this.app?.tree || !this.image) return

    try {
      const fileName = this.image.fileName || 'annotated.png'
      const extMatch = fileName.match(/\.([^.]+)$/)
      const ext = extMatch ? extMatch[1].toLowerCase() : 'png'
      const format =
        ext === 'jpeg'
          ? 'jpg'
          : ext === 'jpg'
          ? 'jpg'
          : ext === 'webp'
          ? 'webp'
          : 'png'
      const outputExt =
        ext === 'jpeg' || ext === 'jpg' || ext === 'webp' || ext === 'png'
          ? ext
          : 'png'
      const baseName = fileName.replace(/\.[^/.]+$/, '') || 'annotated'

      const exportOptions: {
        blob: boolean
        quality?: number
        fill?: string
      } = {
        blob: true,
      }
      if (format === 'jpg' || format === 'webp') {
        exportOptions.quality = 0.9
        exportOptions.fill = '#ffffff'
      }

      const exportResult = await this.app.tree.export(format, exportOptions)
      const blob = exportResult.data as Blob
      download(blob, `${baseName}.${outputExt}`)
    } catch (error) {
      console.error('Failed to save image:', error)
      toast.error(i18n.t('saveImageError') as string)
    }
  }

  async copyToClipboard() {
    if (!this.app?.tree) return false

    try {
      const exportResult = await this.app.tree.export('png', { blob: true })
      const blob = exportResult.data as Blob
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ])
      return true
    } catch (error) {
      console.error('Failed to copy image:', error)
      return false
    }
  }

  zoomIn() {
    if (!this.app?.tree) return
    const scaleValue = this.app.tree.scale
    const nextScale =
      typeof scaleValue === 'number' ? scaleValue : scaleValue?.x ?? 1
    this.app.tree.zoom(nextScale * 1.1)
    this.syncScaleFromTree()
  }

  zoomOut() {
    if (!this.app?.tree) return
    const scaleValue = this.app.tree.scale
    const nextScale =
      typeof scaleValue === 'number' ? scaleValue : scaleValue?.x ?? 1
    this.app.tree.zoom(nextScale / 1.1)
    this.syncScaleFromTree()
  }

  zoomFit() {
    if (!this.app?.tree) return
    this.app.tree.zoom('fit', 100)
    this.syncScaleFromTree()
  }

  zoomToPercent(percent: number) {
    if (!this.app?.tree) return
    this.app.tree.zoom(percent / 100)
    this.syncScaleFromTree()
  }

  deleteSelected() {
    if (!this.app?.editor) return
    this.app.editor.list.forEach((item) => item.remove())
  }

  private syncScaleFromTree() {
    if (!this.app?.tree) return
    const scaleValue = this.app.tree.scale
    const nextScale =
      typeof scaleValue === 'number' ? scaleValue : scaleValue?.x ?? 1
    this.setScale(nextScale)
  }

  private loadColorsFromStorage() {
    const savedForeground = storage.get(STORAGE_FOREGROUND_KEY)
    const savedBackground = storage.get(STORAGE_BACKGROUND_KEY)

    if (savedForeground) {
      this.foregroundColor = savedForeground
    }
    if (savedBackground) {
      this.backgroundColor = savedBackground
    }
  }

  private loadToolFromStorage() {
    const savedTool = storage.get(STORAGE_TOOL_KEY)
    if (savedTool) {
      this.tool = savedTool as ToolType
    }
  }
}

const store = new Store()

export default store
