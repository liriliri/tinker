import { makeAutoObservable, reaction, runInAction } from 'mobx'
import clone from 'licia/clone'
import contain from 'licia/contain'
import debounce from 'licia/debounce'
import download from 'licia/download'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import isBool from 'licia/isBool'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import isNil from 'licia/isNil'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import isStrBlank from 'licia/isStrBlank'
import toBool from 'licia/toBool'
import map from 'licia/map'
import toStr from 'licia/toStr'
import trim from 'licia/trim'
import toast from 'react-hot-toast'
import i18n from 'i18next'
import BaseStore, { storage } from 'share/store/Base'
import { isOnline, openImageFile } from 'share/lib/util'
import {
  DEFAULT_BACKGROUND,
  DEFAULT_ICON,
  DEFAULT_PLATFORMS,
  EXPORT_SIZES,
  THEME_PRESETS,
} from './lib/presets'
import { applyBackgroundPartial, applyIconPartial } from './lib/config'
import {
  buildAiIconFileName,
  buildAiIconPrompt,
  chromaKeyImageFile,
} from './lib/chromaKey'
import { buildExportPng, buildExportZip } from './lib/export'
import { stripExt } from './lib/util'
import type {
  BackgroundColorPreset,
  BackgroundConfig,
  EditorSectionId,
  IconConfig,
  PlatformId,
  SectionOpenState,
  SourceImage,
} from './types'
import { CANVAS_SIZE, DEFAULT_SECTION_OPEN, EDITOR_SECTION_IDS } from './types'

const STORAGE_PLATFORMS = 'selectedPlatforms'
const STORAGE_EDITOR = 'editorSettings'
const STORAGE_SECTION_OPEN = 'sectionOpen'
const STORAGE_AI_PROMPT = 'aiPrompt'
const STORAGE_AI_TRANSPARENT_BG = 'aiTransparentBg'
const SAVE_DEBOUNCE_MS = 200
const AI_ICON_SIZE = '1024x1024'

interface PersistedEditor {
  icon?: Partial<IconConfig>
  background?: Partial<BackgroundConfig>
  activePreset?: string
}

class Store extends BaseStore {
  source: SourceImage | null = null
  sourceImageEl: HTMLImageElement | null = null
  icon: IconConfig = clone(DEFAULT_ICON)
  background: BackgroundConfig = clone(DEFAULT_BACKGROUND)
  activePreset = 'ios'
  selectedPlatforms: PlatformId[] = []
  sectionOpen: SectionOpenState = { ...DEFAULT_SECTION_OPEN }
  singleExportSize = CANVAS_SIZE
  isExporting = false
  previewVersion = 0
  hasAiImageProvider = false
  aiPrompt = ''
  aiTransparentBg = true
  isAiGenerating = false

  private readonly debouncedSaveEditor = debounce(() => {
    this.saveEditorSettings()
  }, SAVE_DEBOUNCE_MS)

  constructor() {
    super()
    makeAutoObservable(this, {
      sourceImageEl: false,
      debouncedSaveEditor: false,
    } as Record<string, false>)
    this.sectionOpen = this.loadSectionOpenState()
    this.loadSettings()
    this.bindEvent()
    void this.refreshAiImageProviders()
  }

  get hasSource() {
    return !!this.source
  }

  get canGenerateAi() {
    return (
      this.hasAiImageProvider &&
      !this.isAiGenerating &&
      !isStrBlank(this.aiPrompt)
    )
  }

  get presetOptions() {
    const options = map(THEME_PRESETS, (preset) => ({
      value: preset.id,
      label: i18n.t(preset.nameKey),
    }))
    if (!this.activePreset) {
      return [{ value: 'custom', label: i18n.t('presetCustom') }, ...options]
    }
    return options
  }

  get presetSelectValue() {
    return this.activePreset || 'custom'
  }

  get exportSizeOptions() {
    return map(EXPORT_SIZES, (size) => ({
      value: String(size),
      label: `${size}×${size}`,
    }))
  }

  setSingleExportSize(size: number) {
    this.singleExportSize = contain(EXPORT_SIZES, size) ? size : CANVAS_SIZE
  }

  private loadSettings() {
    const platformsRaw = storage.get(STORAGE_PLATFORMS)
    if (platformsRaw) {
      try {
        this.selectedPlatforms = filter(
          JSON.parse(platformsRaw) as string[],
          (id) => contain(DEFAULT_PLATFORMS, id)
        ) as PlatformId[]
      } catch {
        // keep defaults
      }
    }

    this.loadEditorSettings()

    const savedPrompt = storage.get(STORAGE_AI_PROMPT)
    if (isStr(savedPrompt)) this.aiPrompt = savedPrompt

    const savedTransparent = storage.get(STORAGE_AI_TRANSPARENT_BG)
    if (!isNil(savedTransparent)) {
      this.aiTransparentBg = toBool(savedTransparent)
    }
  }

  private async refreshAiImageProviders() {
    if (isOnline()) {
      this.hasAiImageProvider = false
      return
    }
    try {
      const providers = await tinker.getAIImageProviders()
      runInAction(() => {
        this.hasAiImageProvider = providers.length > 0
      })
    } catch (err) {
      console.error('Failed to load AI image providers:', err)
      runInAction(() => {
        this.hasAiImageProvider = false
      })
    }
  }

  setAiPrompt(value: string) {
    this.aiPrompt = value
    storage.set(STORAGE_AI_PROMPT, value)
  }

  setAiTransparentBg(value: boolean) {
    this.aiTransparentBg = value
    storage.set(STORAGE_AI_TRANSPARENT_BG, String(value))
  }

  async generateAiIcon() {
    if (!this.canGenerateAi) return

    const prompt = trim(this.aiPrompt)
    const transparentBg = this.aiTransparentBg
    this.isAiGenerating = true
    try {
      const result = await tinker.generateImage({
        prompt: buildAiIconPrompt(prompt, transparentBg, this.background),
        size: AI_ICON_SIZE,
        count: 1,
      })
      const output = result.images[0]
      if (!output?.path) {
        throw new Error('No image returned')
      }

      const buffer = new Uint8Array(await tinker.readFile(output.path))
      const mimeType = output.mimeType || 'image/png'
      const fileName = buildAiIconFileName(mimeType, transparentBg)
      const rawFile = new File([buffer as BlobPart], fileName, {
        type: mimeType,
      })
      const file = transparentBg
        ? await chromaKeyImageFile(rawFile, fileName)
        : rawFile
      await this.loadImage(file)
    } catch (err) {
      const message = isErr(err) ? err.message : toStr(err)
      toast.error(i18n.t('aiGenerateFailed', { message }))
      console.error('Failed to generate AI icon:', err)
    } finally {
      runInAction(() => {
        this.isAiGenerating = false
      })
    }
  }

  private loadEditorSettings() {
    const saved = storage.get(STORAGE_EDITOR) as PersistedEditor | null
    if (!saved || !isObj(saved)) {
      const legacyPreset = storage.get('activePreset')
      const presetId = isStr(legacyPreset) ? legacyPreset : 'ios'
      const preset =
        find(THEME_PRESETS, (item) => item.id === presetId) ||
        find(THEME_PRESETS, (item) => item.id === 'ios')
      if (preset) {
        this.activePreset = preset.id
        this.icon = clone(preset.icon)
        this.background = clone(preset.background)
        this.saveEditorSettings()
      }
      return
    }

    if (saved.icon && isObj(saved.icon)) {
      this.icon = applyIconPartial(clone(DEFAULT_ICON), saved.icon)
    }
    if (saved.background && isObj(saved.background)) {
      this.background = applyBackgroundPartial(
        clone(DEFAULT_BACKGROUND),
        saved.background
      )
    }

    if (isStr(saved.activePreset) && saved.activePreset) {
      const preset = find(
        THEME_PRESETS,
        (item) => item.id === saved.activePreset
      )
      if (preset) {
        this.activePreset = preset.id
        this.icon = clone(preset.icon)
        this.background = clone(preset.background)
        return
      }
    }

    this.activePreset = ''
  }

  private saveEditorSettings() {
    const data: PersistedEditor = {
      icon: clone(this.icon),
      background: clone(this.background),
      activePreset: this.activePreset,
    }
    storage.set(STORAGE_EDITOR, data)
  }

  private bindEvent() {
    reaction(
      () => this.source?.fileName || '',
      (name) => {
        if (isOnline()) return
        tinker.setTitle(name || '')
      }
    )
  }

  bumpPreview() {
    this.previewVersion += 1
  }

  setSectionOpen(sectionId: EditorSectionId, open: boolean) {
    if (this.sectionOpen[sectionId] === open) return
    this.sectionOpen = { ...this.sectionOpen, [sectionId]: open }
    this.saveSectionOpenState()
  }

  async openImageDialog() {
    const result = await openImageFile({
      title: i18n.t('openTitle'),
      extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'],
    })
    if (!result) return
    await this.loadImage(result.file)
  }

  async loadDroppedFile(file: File) {
    await this.loadImage(file)
  }

  clearSource() {
    if (this.source?.url) URL.revokeObjectURL(this.source.url)
    this.source = null
    this.sourceImageEl = null
    this.bumpPreview()
  }

  async loadImage(file: File) {
    const url = URL.createObjectURL(file)
    try {
      const img = await loadHtmlImage(url)
      if (this.source?.url) URL.revokeObjectURL(this.source.url)

      this.sourceImageEl = img
      this.source = {
        fileName: file.name,
        url,
      }
      this.bumpPreview()
    } catch (err) {
      URL.revokeObjectURL(url)
      console.error(err)
      toast.error(i18n.t('loadFailed'))
    }
  }

  applyPreset(id: string) {
    const preset = find(THEME_PRESETS, (item) => item.id === id)
    if (!preset) return
    this.activePreset = id
    this.icon = clone(preset.icon)
    this.background = clone(preset.background)
    this.saveEditorSettings()
    this.bumpPreview()
  }

  updateIcon(partial: Partial<IconConfig>) {
    this.icon = applyIconPartial(this.icon, partial)
    this.activePreset = ''
    this.debouncedSaveEditor()
    this.bumpPreview()
  }

  updateBackground(partial: Partial<BackgroundConfig>) {
    this.background = applyBackgroundPartial(this.background, partial)
    this.activePreset = ''
    this.debouncedSaveEditor()
    this.bumpPreview()
  }

  applyBackgroundColorPreset(preset: BackgroundColorPreset) {
    if (preset.gradientEnd) {
      this.updateBackground({
        transparent: false,
        useGradient: true,
        color: preset.color,
        gradientEnd: preset.gradientEnd,
        gradientAngle: preset.gradientAngle ?? 135,
      })
      return
    }
    this.updateBackground({
      transparent: false,
      useGradient: false,
      color: preset.color,
    })
  }

  isBackgroundColorPresetActive(preset: BackgroundColorPreset) {
    if (this.background.transparent) return false
    if (preset.gradientEnd) {
      return (
        this.background.useGradient &&
        this.background.color === preset.color &&
        this.background.gradientEnd === preset.gradientEnd
      )
    }
    return (
      !this.background.useGradient && this.background.color === preset.color
    )
  }

  togglePlatform(id: PlatformId) {
    if (contain(this.selectedPlatforms, id)) {
      this.selectedPlatforms = filter(
        this.selectedPlatforms,
        (item) => item !== id
      )
    } else {
      this.selectedPlatforms = [...this.selectedPlatforms, id]
    }
    storage.set(STORAGE_PLATFORMS, JSON.stringify(this.selectedPlatforms))
  }

  isPlatformSelected(id: PlatformId) {
    return contain(this.selectedPlatforms, id)
  }

  async export(): Promise<boolean> {
    if (!this.source || this.isExporting) return false
    this.isExporting = true
    try {
      if (isEmpty(this.selectedPlatforms)) {
        const size = this.singleExportSize
        const pngBytes = await buildExportPng(
          this.sourceImageEl,
          this.icon,
          this.background,
          size
        )
        return this.saveExportFile(
          pngBytes,
          `${stripExt(this.source.fileName)}-${size}.png`,
          'image/png',
          'PNG',
          ['png']
        )
      }

      const zipBytes = await buildExportZip(
        this.sourceImageEl,
        this.icon,
        this.background,
        this.selectedPlatforms
      )
      return this.saveExportFile(
        zipBytes,
        `${stripExt(this.source.fileName)}-icons.zip`,
        'application/zip',
        'ZIP',
        ['zip']
      )
    } catch (err) {
      console.error(err)
      toast.error(i18n.t('exportFailed'))
      return false
    } finally {
      this.isExporting = false
    }
  }

  private async saveExportFile(
    bytes: Uint8Array,
    defaultName: string,
    mimeType: string,
    filterName: string,
    extensions: string[]
  ): Promise<boolean> {
    if (isOnline()) {
      download(
        new Blob([bytes as BlobPart], { type: mimeType }),
        defaultName,
        mimeType
      )
      toast.success(i18n.t('exportSuccess'))
      return true
    }

    const result = await tinker.showSaveDialog({
      title: i18n.t('exportTitle'),
      defaultPath: defaultName,
      filters: [{ name: filterName, extensions }],
    })
    if (result.canceled || !result.filePath) return false

    await tinker.writeFile(result.filePath, bytes)
    tinker.showItemInPath(result.filePath)
    toast.success(i18n.t('exportSuccess'))
    return true
  }

  private loadSectionOpenState(): SectionOpenState {
    const saved = storage.get(STORAGE_SECTION_OPEN)
    if (!isObj(saved)) {
      return { ...DEFAULT_SECTION_OPEN }
    }

    const stored = saved as Partial<SectionOpenState>
    const next = { ...DEFAULT_SECTION_OPEN }
    each(EDITOR_SECTION_IDS, (id) => {
      if (isBool(stored[id])) {
        next[id] = stored[id]!
      }
    })
    return next
  }

  private saveSectionOpenState() {
    storage.set(STORAGE_SECTION_OPEN, this.sectionOpen)
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

export default new Store()
