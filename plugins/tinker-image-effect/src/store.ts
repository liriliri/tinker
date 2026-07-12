import { makeAutoObservable, reaction, runInAction } from 'mobx'
import i18n from 'i18next'
import dateFormat from 'licia/dateFormat'
import debounce from 'licia/debounce'
import isEqual from 'licia/isEqual'
import isErr from 'licia/isErr'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import toStr from 'licia/toStr'
import toast from 'react-hot-toast'
import BaseStore from 'share/store/Base'
import { getFileExt, getMimeTypeFromPath } from 'share/lib/fileType'
import { openImageFile, resolveSavePath } from 'share/lib/util'
import { EffectRenderer } from './lib/renderer'
import { extractJpegExif, injectJpegExif } from 'share/lib/exif'
import {
  cloneEffectParams,
  createDefaultEffectParams,
  type AsciiParams,
  type EffectId,
  type EffectParamsMap,
  type ImageInfo,
  type PixelateParams,
  type SketchParams,
} from './types'

const storage = new LocalStore('tinker-image-effect')
const STORAGE_OVERWRITE = 'overwriteOriginal'
const RENDER_DEBOUNCE_MS = 200

function createDefaultEffectState() {
  return {
    effectId: 'original' as EffectId,
    params: createDefaultEffectParams(),
  }
}

class Store extends BaseStore {
  image: ImageInfo | null = null
  effectId: EffectId = 'original'
  params: EffectParamsMap = createDefaultEffectParams()
  previewVersion = 0
  isLoading = false
  isSaved = false
  overwriteOriginal = false

  private renderer: EffectRenderer | null = null
  private renderFrame: number | null = null
  private jpegExifSegment: Uint8Array | null = null
  private readonly debouncedRender = debounce(() => {
    this.scheduleRender()
  }, RENDER_DEBOUNCE_MS)

  constructor() {
    super()
    this.overwriteOriginal = this.loadOverwriteOriginal()
    makeAutoObservable(this, {
      debouncedRender: false,
    })
    this.bindEvent()
  }

  private bindEvent() {
    reaction(
      () => this.currentFileName,
      (fileName) => {
        tinker.setTitle(fileName || '')
      }
    )
  }

  initRenderer() {
    this.disposeRenderer()
    this.renderer = new EffectRenderer()
  }

  disposeRenderer() {
    this.renderer?.dispose()
    this.renderer = null
  }

  async openImageDialog() {
    const result = await openImageFile({ title: i18n.t('openImage') })
    if (result) {
      await this.loadImage(result.file, result.filePath)
    }
  }

  async loadImage(file: File, filePath?: string) {
    if (!this.renderer) {
      throw new Error('Effect renderer is not initialized')
    }

    try {
      this.isLoading = true
      const sourceBuffer = filePath
        ? new Uint8Array(await tinker.readFile(filePath))
        : new Uint8Array(await file.arrayBuffer())
      this.jpegExifSegment = extractJpegExif(sourceBuffer)

      const loadResult = await this.renderer.loadImage(file)

      runInAction(() => {
        this.image = {
          fileName: file.name,
          filePath,
          width: loadResult.width,
          height: loadResult.height,
        }
        this.applyDefaultEffect()
        this.isSaved = false
      })

      if (loadResult.downscaled) {
        toast(
          i18n.t('imageDownscaled', {
            width: loadResult.width,
            height: loadResult.height,
            originalWidth: loadResult.originalWidth,
            originalHeight: loadResult.originalHeight,
          })
        )
      }

      this.drawPreview()
    } catch (err) {
      const message = isErr(err) ? err.message : toStr(err)
      toast.error(i18n.t('imageLoadFailed', { message }))
      console.error('Failed to load image:', err)
      throw err
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  setEffect(effectId: EffectId) {
    if (this.effectId === effectId) return
    this.effectId = effectId
    this.applyStateChange()
  }

  setSketchParam<K extends keyof SketchParams>(key: K, value: SketchParams[K]) {
    this.params = cloneEffectParams({
      ...this.params,
      sketch: { ...this.params.sketch, [key]: value },
    })
    this.applyParamChange()
  }

  setPixelateParam<K extends keyof PixelateParams>(
    key: K,
    value: PixelateParams[K]
  ) {
    this.params = cloneEffectParams({
      ...this.params,
      pixelate: { ...this.params.pixelate, [key]: value },
    })
    this.applyParamChange()
  }

  setAsciiParam<K extends keyof AsciiParams>(key: K, value: AsciiParams[K]) {
    this.params = cloneEffectParams({
      ...this.params,
      ascii: { ...this.params.ascii, [key]: value },
    })
    this.applyParamChange()
  }

  resetEffect() {
    this.applyDefaultEffect()
    this.isSaved = false
    this.scheduleRender()
  }

  private applyDefaultEffect() {
    const initial = createDefaultEffectState()
    this.effectId = initial.effectId
    this.params = initial.params
  }

  private applyStateChange() {
    this.isSaved = false
    this.scheduleRender()
  }

  private applyParamChange() {
    this.isSaved = false
    this.debouncedRender()
  }

  setOverwriteOriginal(overwrite: boolean) {
    this.overwriteOriginal = overwrite
    storage.set(STORAGE_OVERWRITE, String(overwrite))
  }

  private loadOverwriteOriginal(): boolean {
    const saved = storage.get(STORAGE_OVERWRITE)
    return saved === 'true'
  }

  scheduleRender() {
    if (!this.renderer?.hasImage) return

    if (this.renderFrame !== null) {
      cancelAnimationFrame(this.renderFrame)
    }

    this.renderFrame = requestAnimationFrame(() => {
      this.renderFrame = null
      this.drawPreview()
    })
  }

  drawPreview() {
    if (!this.renderer?.hasImage) return
    this.renderer.render(this.effectId, this.params)
    this.previewVersion++
  }

  async saveImage() {
    if (!this.image || !this.renderer?.hasImage) return

    try {
      let savePath: string

      if (this.overwriteOriginal && this.image.filePath) {
        savePath = this.image.filePath
      } else {
        const result = await tinker.showSaveDialog({
          defaultPath: this.getDefaultSavePath(),
          filters: [
            {
              name: i18n.t('imageFiles'),
              extensions: ['png', 'jpg', 'jpeg', 'webp'],
            },
          ],
        })

        if (result.canceled || !result.filePath) {
          return
        }

        savePath = await resolveSavePath(result.filePath)
      }
      const ext = getFileExt(savePath) || 'png'
      const mimeType = getMimeTypeFromPath(savePath) || 'image/png'

      const blob = await this.renderer.exportBlob(
        this.effectId,
        this.params,
        mimeType
      )
      let output = new Uint8Array(await blob.arrayBuffer())

      if (
        (ext === 'jpg' || ext === 'jpeg') &&
        this.jpegExifSegment &&
        output[0] === 0xff &&
        output[1] === 0xd8
      ) {
        output = injectJpegExif(output, this.jpegExifSegment)
      }

      await tinker.writeFile(savePath, output)

      runInAction(() => {
        this.isSaved = true
      })

      return savePath
    } catch (err) {
      console.error('Failed to save image:', err)
      throw err
    }
  }

  private getDefaultSavePath(): string {
    if (!this.image) return `image-${dateFormat('yyyymmddHH')}.png`

    const { name, ext } = splitPath(this.image.fileName)
    const stem = ext ? name.slice(0, -ext.length) : name
    const fileName = `${stem}-${dateFormat('yyyymmddHH')}${ext || '.png'}`

    if (this.image.filePath) {
      const { dir } = splitPath(this.image.filePath)
      return `${dir}${fileName}`
    }

    return fileName
  }

  get hasImage() {
    return this.image !== null
  }

  get currentFileName() {
    return this.image?.fileName ?? ''
  }

  get hasChanges() {
    return !isEqual(
      { effectId: this.effectId, params: this.params },
      createDefaultEffectState()
    )
  }

  get previewCanvas() {
    return this.renderer?.canvas ?? null
  }
}

export default new Store()
