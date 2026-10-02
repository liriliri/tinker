import { makeAutoObservable, reaction, runInAction } from 'mobx'
import i18n from 'i18next'
import clone from 'licia/clone'
import contain from 'licia/contain'
import dateFormat from 'licia/dateFormat'
import debounce from 'licia/debounce'
import fileUrl from 'licia/fileUrl'
import isEqual from 'licia/isEqual'
import isErr from 'licia/isErr'
import isStrBlank from 'licia/isStrBlank'
import splitPath from 'licia/splitPath'
import toBool from 'licia/toBool'
import toStr from 'licia/toStr'
import toast from 'react-hot-toast'
import BaseStore, { storage } from 'share/store/Base'
import { getFileExt, getMimeTypeFromPath } from 'share/lib/fileType'
import { openImageFile, resolveSavePath } from 'share/lib/util'
import { EffectRenderer } from './lib/renderer'
import { DEFAULT_ASCII_PARAMS } from './lib/ascii'
import { DEFAULT_PIXELATE_PARAMS } from './lib/pixelate'
import { DEFAULT_SKETCH_PARAMS } from './lib/sketch'
import { extractJpegExif, injectJpegExif } from 'share/lib/exif'
import { createMcpApi } from './mcp'
import {
  DEFAULT_AI_PARAMS,
  EFFECTS,
  type AiParams,
  type AsciiParams,
  type EffectId,
  type EffectParamsMap,
  type ImageInfo,
  type PixelateParams,
  type SketchParams,
} from './types'

const STORAGE_OVERWRITE = 'overwriteOriginal'
const STORAGE_EFFECT_ID = 'effectId'
const RENDER_DEBOUNCE_MS = 200
const EFFECT_IDS = EFFECTS.map((effect) => effect.id)

function createDefaultEffectParams(): EffectParamsMap {
  return {
    sketch: clone(DEFAULT_SKETCH_PARAMS),
    pixelate: clone(DEFAULT_PIXELATE_PARAMS),
    ascii: clone(DEFAULT_ASCII_PARAMS),
    ai: clone(DEFAULT_AI_PARAMS),
  }
}

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  image: ImageInfo | null = null
  effectId: EffectId = 'sketch'
  params: EffectParamsMap = createDefaultEffectParams()
  previewVersion = 0
  isLoading = false
  isAiApplying = false
  isSaved = false
  overwriteOriginal = false
  hasAiImageProvider = false

  private renderer: EffectRenderer | null = null
  private renderFrame: number | null = null
  private jpegExifSegment: Uint8Array | null = null
  private aiResultPath: string | null = null
  private readonly debouncedRender = debounce(() => {
    this.scheduleRender()
  }, RENDER_DEBOUNCE_MS)

  constructor() {
    super()
    this.overwriteOriginal = this.loadOverwriteOriginal()
    this.effectId = this.loadEffectId()
    makeAutoObservable(this, {
      debouncedRender: false,
    } as Record<string, false>)
    this.bindEvent()
    void this.refreshAiImageProviders()
  }

  private bindEvent() {
    reaction(
      () => this.currentFileName,
      (fileName) => {
        tinker.setTitle(fileName || '')
      }
    )
  }

  async refreshAiImageProviders() {
    try {
      const providers = await tinker.getAIImageProviders()
      runInAction(() => {
        this.hasAiImageProvider = providers.length > 0
        if (this.effectId === 'ai' && !this.hasAiImageProvider) {
          this.effectId = 'sketch'
          storage.set(STORAGE_EFFECT_ID, 'sketch')
        }
      })
    } catch (err) {
      console.error('Failed to load AI image providers:', err)
      runInAction(() => {
        this.hasAiImageProvider = false
        if (this.effectId === 'ai') {
          this.effectId = 'sketch'
          storage.set(STORAGE_EFFECT_ID, 'sketch')
        }
      })
    }
  }

  get availableEffects() {
    if (this.hasAiImageProvider) return EFFECTS
    return EFFECTS.filter((effect) => effect.id !== 'ai')
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
      this.aiResultPath = null
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
    if (effectId === 'ai' && !this.hasAiImageProvider) return
    this.effectId = effectId
    storage.set(STORAGE_EFFECT_ID, effectId)
    if (effectId !== 'ai') {
      this.aiResultPath = null
    }
    this.applyStateChange()
  }

  setSketchParam<K extends keyof SketchParams>(key: K, value: SketchParams[K]) {
    this.params = {
      ...this.params,
      sketch: { ...this.params.sketch, [key]: value },
    }
    this.applyParamChange()
  }

  setPixelateParam<K extends keyof PixelateParams>(
    key: K,
    value: PixelateParams[K]
  ) {
    this.params = {
      ...this.params,
      pixelate: { ...this.params.pixelate, [key]: value },
    }
    this.applyParamChange()
  }

  setAsciiParam<K extends keyof AsciiParams>(key: K, value: AsciiParams[K]) {
    this.params = {
      ...this.params,
      ascii: { ...this.params.ascii, [key]: value },
    }
    this.applyParamChange()
  }

  setAiParam<K extends keyof AiParams>(key: K, value: AiParams[K]) {
    this.params = {
      ...this.params,
      ai: { ...this.params.ai, [key]: value },
    }
    this.isSaved = false
  }

  get canApplyAi() {
    return (
      this.hasImage &&
      this.hasAiImageProvider &&
      this.effectId === 'ai' &&
      !this.isAiApplying &&
      !isStrBlank(this.params.ai.prompt)
    )
  }

  async applyAiEffect() {
    if (!this.canApplyAi || !this.renderer?.hasImage) return

    const prompt = this.params.ai.prompt.trim()
    try {
      this.isAiApplying = true
      const imageInput = this.image?.filePath
        ? this.image.filePath
        : await this.renderer.getSourceDataUrl('image/png')

      const result = await tinker.editImage({
        prompt,
        image: imageInput,
      })
      const output = result.images[0]
      if (!output?.path) {
        throw new Error('No image returned')
      }

      const preview = await this.renderer.loadPreviewFromUrl(
        fileUrl(output.path)
      )
      runInAction(() => {
        this.aiResultPath = output.path
        this.isSaved = false
        if (this.image) {
          this.image = {
            ...this.image,
            width: preview.width,
            height: preview.height,
          }
        }
        this.previewVersion++
      })
    } catch (err) {
      const message = isErr(err) ? err.message : toStr(err)
      toast.error(i18n.t('aiApplyFailed', { message }))
      console.error('Failed to apply AI effect:', err)
    } finally {
      runInAction(() => {
        this.isAiApplying = false
      })
    }
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
    return toBool(storage.get(STORAGE_OVERWRITE))
  }

  private loadEffectId(): EffectId {
    const saved = storage.get(STORAGE_EFFECT_ID)
    return contain(EFFECT_IDS, saved) ? (saved as EffectId) : 'sketch'
  }

  scheduleRender() {
    if (!this.renderer?.hasImage) return
    if (this.effectId === 'ai' && this.aiResultPath) return

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
    if (this.effectId === 'ai' && this.aiResultPath) return
    this.renderer.render(this.effectId, this.params)
    this.previewVersion++
  }

  async saveImage(outputPath?: string) {
    if (!this.image || !this.renderer?.hasImage) return

    try {
      let savePath: string

      if (this.overwriteOriginal && this.image.filePath) {
        savePath = this.image.filePath
      } else if (outputPath) {
        savePath = outputPath
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

      if (this.effectId === 'ai' && this.aiResultPath) {
        const bytes = new Uint8Array(await tinker.readFile(this.aiResultPath))
        await tinker.writeFile(savePath, bytes)
      } else {
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
      }

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
    if (this.effectId === 'ai') {
      return !!this.aiResultPath
    }

    return !isEqual(
      { effectId: this.effectId, params: this.params },
      {
        effectId: 'sketch' as EffectId,
        params: createDefaultEffectParams(),
      }
    )
  }

  get previewCanvas() {
    return this.renderer?.canvas ?? null
  }
}

export default new Store()
