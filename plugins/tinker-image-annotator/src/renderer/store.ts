import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import { alert } from 'share/components/Alert'
import { THEME_COLORS } from 'share/theme'
import i18n from './i18n'
import type { App } from 'leafer-ui'

export type ToolType = 'select' | 'rect' | 'ellipse' | 'line' | 'pen' | 'text'

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
  foregroundColor: string = THEME_COLORS.primary
  backgroundColor: string = THEME_COLORS.bg.light.primary
  fontSize: number = 28

  constructor() {
    super()
    makeAutoObservable(this)
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
  }

  setForegroundColor(color: string) {
    this.foregroundColor = color
  }

  setBackgroundColor(color: string) {
    this.backgroundColor = color
  }

  swapColors() {
    const nextForeground = this.backgroundColor
    const nextBackground = this.foregroundColor
    this.foregroundColor = nextForeground
    this.backgroundColor = nextBackground
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
      const result = await tinker.showSaveDialog({
        defaultPath: this.image?.fileName || 'annotated.png',
        filters: [{ name: 'PNG', extensions: ['png'] }],
      })

      if (result.canceled || !result.filePath) return

      const exportResult = await this.app.tree.export('png', {
        pixelRatio: 2,
        blob: true,
      })
      const blob = exportResult.data as Blob
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const baseName =
        this.image.fileName.replace(/\.[^/.]+$/, '') || 'annotated'

      link.href = url
      link.download = `${baseName}-annotated.png`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      alert({ title: i18n.t('saved') as string })
    } catch (error) {
      console.error('Failed to save image:', error)
      alert({ title: i18n.t('saveImageError') as string })
    }
  }

  zoomIn() {
    if (!this.app?.tree) return
    this.app.tree.zoom(this.app.tree.scale * 1.1)
  }

  zoomOut() {
    if (!this.app?.tree) return
    this.app.tree.zoom(this.app.tree.scale / 1.1)
  }

  zoomFit() {
    if (!this.app?.tree) return
    this.app.tree.zoom('fit', 100)
  }

  deleteSelected() {
    if (!this.app?.editor) return
    this.app.editor.list.forEach((item) => item.remove())
  }
}

const store = new Store()

export default store
