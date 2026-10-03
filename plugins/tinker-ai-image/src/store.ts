import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore, { storage } from 'share/store/Base'
import { initAiChatAvailability } from 'share/lib/aiChat/aiAvailability'
import clamp from 'licia/clamp'
import contain from 'licia/contain'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import isNum from 'licia/isNum'
import isStr from 'licia/isStr'
import isStrBlank from 'licia/isStrBlank'
import last from 'licia/last'
import map from 'licia/map'
import range from 'licia/range'
import some from 'licia/some'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import toast from 'react-hot-toast'
import i18n from 'i18next'
import {
  clampImageSize,
  fitImageSize,
  formatSize,
  getErrorMessage,
  loadImageSize,
  parseSizeString,
  pickAiImagePath,
} from './lib/util'
import {
  DEFAULT_SETTINGS,
  IMAGE_COUNT_MAX,
  IMAGE_COUNT_MIN,
  IMAGE_LIST_ITEM_SIZE_MAX,
  IMAGE_LIST_ITEM_SIZE_MIN,
  REFERENCE_IMAGE_MAX,
  type GalleryImage,
  type GenSettings,
  type GenTask,
  type ReferenceImageTab,
} from './types'

const STORAGE_SETTINGS = 'settings'
const MAX_GALLERY = 200

interface SelectOption {
  label: string
  value: string
}

class Store extends BaseStore {
  prompt = DEFAULT_SETTINGS.prompt
  provider = DEFAULT_SETTINGS.provider
  model = DEFAULT_SETTINGS.model
  width = DEFAULT_SETTINGS.width
  height = DEFAULT_SETTINGS.height
  count = DEFAULT_SETTINGS.count
  outputDir = DEFAULT_SETTINGS.outputDir
  imageListItemSize = DEFAULT_SETTINGS.imageListItemSize

  providers: tinker.AiImageProviderInfo[] = []
  images: GalleryImage[] = []
  selectedImageId = ''
  initImagePath = ''
  referenceImages: ReferenceImageTab[] = []
  activeReferenceId = ''
  tasks: GenTask[] = []
  hasAI = false
  isOptimizingPrompt = false
  private running = false
  private currentAbort: (() => void) | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.addReferenceImage()
    this.loadStorage()
    void this.refreshProviders()
    void initAiChatAvailability(storage).then(({ hasAI }) => {
      runInAction(() => {
        this.hasAI = hasAI
      })
    })
  }

  get selectedImage(): GalleryImage | null {
    return find(this.images, (img) => img.id === this.selectedImageId) ?? null
  }

  get selectedProvider(): tinker.AiImageProviderInfo | null {
    if (isEmpty(this.providers)) return null
    return (
      find(this.providers, (p) => p.name === this.provider) ?? this.providers[0]
    )
  }

  get modelNames(): string[] {
    const provider = this.selectedProvider
    if (!provider) return []
    return map(provider.models, (m) => m.name)
  }

  get providerOptions(): SelectOption[] {
    return map(this.providers, (p) => ({
      label: p.name,
      value: p.name,
    }))
  }

  get modelOptions(): SelectOption[] {
    return map(this.modelNames, (name) => ({
      label: name,
      value: name,
    }))
  }

  get size(): string {
    return formatSize(this.width, this.height)
  }

  get filledReferenceImages(): string[] {
    return filter(
      map(this.referenceImages, (tab) => tab.path),
      (path) => !isStrBlank(path)
    )
  }

  get selectedReferenceImage(): ReferenceImageTab | null {
    return (
      find(this.referenceImages, (tab) => tab.id === this.activeReferenceId) ??
      this.referenceImages[0] ??
      null
    )
  }

  get canAddReferenceImage(): boolean {
    return this.referenceImages.length < REFERENCE_IMAGE_MAX
  }

  get isBusy(): boolean {
    return some(
      this.tasks,
      (task) => task.status === 'wait' || task.status === 'generating'
    )
  }

  get queueCount(): number {
    return filter(
      this.tasks,
      (task) => task.status === 'wait' || task.status === 'generating'
    ).length
  }

  private loadStorage() {
    const settings = storage.get(STORAGE_SETTINGS) as
      | (Partial<GenSettings> & { size?: string })
      | null
    if (settings) {
      this.prompt = settings.prompt ?? this.prompt
      this.provider = settings.provider ?? this.provider
      this.model = settings.model ?? this.model
      if (isNum(settings.width)) {
        this.width = clampImageSize(settings.width)
      }
      if (isNum(settings.height)) {
        this.height = clampImageSize(settings.height)
      } else if (settings.size) {
        const parsed = parseSizeString(settings.size)
        if (parsed) {
          this.width = parsed.width
          this.height = parsed.height
        }
      }
      this.count = settings.count ?? this.count
      this.outputDir = settings.outputDir ?? this.outputDir
      if (isNum(settings.imageListItemSize)) {
        this.imageListItemSize = clamp(
          settings.imageListItemSize,
          IMAGE_LIST_ITEM_SIZE_MIN,
          IMAGE_LIST_ITEM_SIZE_MAX
        )
      }
    }

    // Drop legacy gallery persistence; list is session-only.
    storage.remove('images')
  }

  private persistSettings() {
    const settings: GenSettings = {
      prompt: this.prompt,
      provider: this.provider,
      model: this.model,
      width: this.width,
      height: this.height,
      count: this.count,
      outputDir: this.outputDir,
      imageListItemSize: this.imageListItemSize,
    }
    storage.set(STORAGE_SETTINGS, settings)
  }

  async refreshProviders() {
    try {
      const list = await tinker.getAIImageProviders()
      runInAction(() => {
        this.providers = list
        if (isEmpty(list)) {
          this.provider = ''
          this.model = ''
          return
        }
        const matched = find(list, (p) => p.name === this.provider) ?? list[0]
        this.provider = matched.name
        const models = map(matched.models, (m) => m.name)
        if (!contain(models, this.model)) {
          this.model = models[0] ?? ''
        }
        this.persistSettings()
      })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  setPrompt(value: string) {
    this.prompt = value
    this.persistSettings()
  }

  async pastePrompt() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) this.setPrompt(text)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  clearPrompt() {
    this.setPrompt('')
  }

  async optimizePrompt() {
    if (!this.hasAI || this.isOptimizingPrompt || isStrBlank(this.prompt)) {
      return
    }

    this.isOptimizingPrompt = true
    const loadingToast = toast.loading(i18n.t('optimizingPrompt'))

    try {
      const task = this.initImagePath
        ? "Improve the user's prompt so it clearly describes how to edit the init image, using any extra reference images as style or content guidance when relevant."
        : "Improve the user's prompt to be more detailed, vivid, and effective for image models."
      const systemPrompt = `You are an expert at writing prompts for AI image ${
        this.initImagePath ? 'editing' : 'generation'
      }. ${task} Keep the same language as the original prompt (do not translate). Return ONLY the improved prompt text without quotes, explanation, or markdown.`

      const result = await tinker.callAI({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.prompt },
        ],
      })

      const content = isStr(result.content) ? trim(result.content) : ''
      if (!content) {
        toast.error(i18n.t('optimizePromptFailed'), { id: loadingToast })
        return
      }

      this.setPrompt(content)
      toast.success(i18n.t('optimizePromptSuccess'), { id: loadingToast })
    } catch (err) {
      toast.error(getErrorMessage(err) || i18n.t('optimizePromptFailed'), {
        id: loadingToast,
      })
    } finally {
      runInAction(() => {
        this.isOptimizingPrompt = false
      })
    }
  }

  setProvider(name: string) {
    this.provider = name
    const provider = find(this.providers, (p) => p.name === name)
    const models = provider ? map(provider.models, (m) => m.name) : []
    this.model = models[0] ?? ''
    this.persistSettings()
  }

  setModel(name: string) {
    this.model = name
    this.persistSettings()
  }

  setWidth(width: number) {
    this.width = clampImageSize(width)
    this.persistSettings()
  }

  setHeight(height: number) {
    this.height = clampImageSize(height)
    this.persistSettings()
  }

  setCount(count: number) {
    this.count = clamp(
      Math.floor(count) || IMAGE_COUNT_MIN,
      IMAGE_COUNT_MIN,
      IMAGE_COUNT_MAX
    )
    this.persistSettings()
  }

  setImageListItemSize(size: number) {
    this.imageListItemSize = clamp(
      Math.round(size),
      IMAGE_LIST_ITEM_SIZE_MIN,
      IMAGE_LIST_ITEM_SIZE_MAX
    )
    this.persistSettings()
  }

  zoomInImageList() {
    this.setImageListItemSize(this.imageListItemSize * 1.1)
  }

  zoomOutImageList() {
    this.setImageListItemSize(this.imageListItemSize * 0.9)
  }

  setOutputDir(dir: string) {
    this.outputDir = dir
    this.persistSettings()
  }

  async chooseOutputDir() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    })
    if (!result.canceled && result.filePaths[0]) {
      this.setOutputDir(result.filePaths[0])
    }
  }

  clearOutputDir() {
    this.setOutputDir('')
  }

  selectImage(id: string) {
    this.selectedImageId = id
  }

  async setInitImagePath(path: string) {
    this.initImagePath = path
    if (!path) return
    try {
      const { width, height } = await loadImageSize(path)
      runInAction(() => {
        const size = fitImageSize(width, height)
        this.width = size.width
        this.height = size.height
        this.persistSettings()
      })
    } catch {
      // Keep current size if image dimensions cannot be read.
    }
  }

  clearInitImage() {
    this.initImagePath = ''
    this.width = DEFAULT_SETTINGS.width
    this.height = DEFAULT_SETTINGS.height
    this.persistSettings()
  }

  async chooseInitImage() {
    const path = await pickAiImagePath()
    if (path) await this.setInitImagePath(path)
  }

  selectReferenceImage(id: string) {
    if (find(this.referenceImages, (tab) => tab.id === id)) {
      this.activeReferenceId = id
    }
  }

  addReferenceImage(path = '') {
    if (!this.canAddReferenceImage) return
    const tab: ReferenceImageTab = {
      id: uuid(),
      title: `${this.referenceImages.length + 1}`,
      path,
    }
    this.referenceImages = [...this.referenceImages, tab]
    this.activeReferenceId = tab.id
  }

  closeReferenceImage(id: string) {
    if (this.referenceImages.length <= 1) return
    const index = this.referenceImages.findIndex((tab) => tab.id === id)
    if (index === -1) return
    this.referenceImages = filter(this.referenceImages, (tab) => tab.id !== id)
    if (this.activeReferenceId === id) {
      const next =
        this.referenceImages[Math.min(index, this.referenceImages.length - 1)]
      this.activeReferenceId = next.id
    }
  }

  moveReferenceImage(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.referenceImages.length ||
      toIndex >= this.referenceImages.length
    ) {
      return
    }
    const next = [...this.referenceImages]
    const [tab] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, tab)
    this.referenceImages = next
  }

  setReferenceImagePath(id: string, path: string) {
    const index = this.referenceImages.findIndex((tab) => tab.id === id)
    if (index === -1) return
    this.referenceImages = map(this.referenceImages, (tab, i) =>
      i === index ? { ...tab, path } : tab
    )
    this.activeReferenceId = id
  }

  clearReferenceImage(id = this.activeReferenceId) {
    this.setReferenceImagePath(id, '')
  }

  async chooseReferenceImage(id = this.activeReferenceId) {
    const path = await pickAiImagePath()
    if (path) this.setReferenceImagePath(id, path)
  }

  removeImage(id: string) {
    this.images = filter(this.images, (img) => img.id !== id)
    if (this.selectedImageId === id) {
      this.selectedImageId = this.images[0]?.id ?? ''
    }
  }

  clearImages() {
    this.images = []
    this.selectedImageId = ''
  }

  enqueueGenerate(times = 1) {
    const prompt = trim(this.prompt)
    if (isStrBlank(prompt)) {
      toast.error(i18n.t('promptRequired'))
      return
    }
    if (isEmpty(this.providers)) {
      toast.error(i18n.t('noProviders'))
      return
    }

    this.tasks.push(
      ...map(range(times), () => ({
        id: uuid(),
        status: 'wait' as const,
        prompt,
        count: this.count,
      }))
    )
    void this.processQueue()
  }

  private abortCurrent() {
    if (this.currentAbort) {
      this.currentAbort()
      this.currentAbort = null
    }
  }

  stopTasks() {
    this.abortCurrent()
    const generating = find(this.tasks, (task) => task.status === 'generating')
    this.tasks = generating ? [generating] : []
  }

  private async processQueue() {
    if (this.running) return
    this.running = true

    while (true) {
      const task = find(this.tasks, (item) => item.status === 'wait')
      if (!task) break

      runInAction(() => {
        task.status = 'generating'
      })

      try {
        await this.runTask(task)
        runInAction(() => {
          this.tasks = filter(this.tasks, (item) => item.id !== task.id)
        })
      } catch (err) {
        const message = getErrorMessage(err)
        if (!/abort/i.test(message)) toast.error(message)
        runInAction(() => {
          this.tasks = filter(this.tasks, (item) => item.id !== task.id)
        })
      } finally {
        this.currentAbort = null
      }
    }

    this.running = false
  }

  private async runTask(task: GenTask) {
    const option: tinker.GenerateImageOption = {
      prompt: task.prompt,
      provider: this.provider || undefined,
      model: this.model || undefined,
      size: this.size || undefined,
      count: task.count,
      outputPath: this.outputDir || undefined,
    }

    const refs = this.filledReferenceImages
    const imageTask = this.initImagePath
      ? tinker.editImage({
          ...option,
          image: this.initImagePath,
          ...(isEmpty(refs) ? {} : { referenceImages: refs }),
        })
      : tinker.generateImage(option)

    this.currentAbort = () => imageTask.abort()
    const result = await imageTask

    runInAction(() => {
      const nextImages: GalleryImage[] = map(result.images, (img) => ({
        id: uuid(),
        path: img.path,
        bytes: img.bytes,
        prompt: task.prompt,
        provider: result.provider,
        model: result.model,
        size: this.size,
      }))
      this.images = [...this.images, ...nextImages].slice(-MAX_GALLERY)
      if (!isEmpty(nextImages)) {
        this.selectedImageId = last(nextImages).id
      }
    })
  }
}

export default new Store()
