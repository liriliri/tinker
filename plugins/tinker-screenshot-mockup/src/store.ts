import { makeAutoObservable, reaction, runInAction } from 'mobx'
import clone from 'licia/clone'
import contain from 'licia/contain'
import download from 'licia/download'
import each from 'licia/each'
import extend from 'licia/extend'
import filter from 'licia/filter'
import find from 'licia/find'
import isArr from 'licia/isArr'
import isNum from 'licia/isNum'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import min from 'licia/min'
import omit from 'licia/omit'
import startWith from 'licia/startWith'
import uuid from 'licia/uuid'
import toast from 'react-hot-toast'
import i18n from 'i18next'
import { type App, type Frame } from 'leafer-ui'
import BaseStore, { storage } from 'share/store/Base'
import { openImageFile } from 'share/lib/util'
import { getDevice } from './lib/devices'
import {
  gradientPresets,
  matchGradientPreset,
  wrapAngle,
} from './lib/gradients'
import { applyGradientBackground, clampCenterToCanvas } from './lib/scene'
import type {
  BackgroundConfig,
  BackgroundType,
  CanvasSize,
  DeviceCategory,
  FrameStyle,
  GradientPreset,
  SceneObject,
} from './types'

const STORAGE_SETTINGS = 'settings'
const BACKGROUND_TYPES: BackgroundType[] = [
  'solid',
  'gradient',
  'transparent',
  'image',
]

interface PersistedSettings {
  background: Omit<BackgroundConfig, 'imageUrl'>
  canvasSize: CanvasSize
}

let gradientPatchRaf = 0

function eachChild(
  frame: Frame,
  fn: (child: {
    id?: string | number
    x?: number
    y?: number
    width?: number
    height?: number
    rotation?: number
    scaleX?: number
    scaleY?: number
    visible?: boolean
  }) => void
) {
  const children = frame.children
  if (!children) return
  each(children, (child) => fn(child as Parameters<typeof fn>[0]))
}

function createDefaultObject(overrides?: Partial<SceneObject>): SceneObject {
  return extend(
    {
      id: uuid(),
      deviceId: 'phone',
      screenshotUrl: null,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      shadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.45)',
        blur: 80,
        offsetX: 0,
        offsetY: 36,
      },
      frameStyle: 'default',
      borderRadius: 16,
    },
    overrides || {}
  )
}

class Store extends BaseStore {
  app: App | null = null
  frame: Frame | null = null
  sceneObjects: SceneObject[] = [createDefaultObject()]
  selectedObjectId: string | null = null
  background: BackgroundConfig = {
    type: 'gradient',
    solidColor: gradientPresets[0].colors[0],
    gradientName: gradientPresets[0].name,
    gradientAngle: gradientPresets[0].angle,
    gradientColors: gradientPresets[0].colors,
    imageUrl: null,
  }
  canvasSize: CanvasSize = {
    width: 1920,
    height: 1080,
    presetName: 'Landscape 16:9',
  }
  isExporting = false
  sceneRevision = 0

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
    reaction(
      () => this.settingsSnapshot(),
      () => this.persistSettings(),
      { delay: 200 }
    )
  }

  get selectedObject(): SceneObject | null {
    return (
      find(this.sceneObjects, (o) => o.id === this.selectedObjectId) ?? null
    )
  }

  setApp(app: App | null) {
    this.app = app
  }

  setFrame(frame: Frame | null) {
    this.frame = frame
  }

  bumpScene() {
    this.sceneRevision += 1
  }

  private patchGradientScene() {
    if (!this.frame) return false
    return applyGradientBackground(this.frame, this.background, this.canvasSize)
  }

  private scheduleGradientPatch() {
    if (gradientPatchRaf) return
    gradientPatchRaf = requestAnimationFrame(() => {
      gradientPatchRaf = 0
      if (!this.patchGradientScene()) this.bumpScene()
    })
  }

  selectObject(id: string | null) {
    this.selectedObjectId = id
  }

  addObject() {
    const obj = createDefaultObject({
      x: 50 + (this.sceneObjects.length % 3) * 4,
      y: 50 + (this.sceneObjects.length % 3) * 4,
    })
    this.sceneObjects.push(obj)
    this.selectedObjectId = obj.id
    this.bumpScene()
  }

  removeObject(id: string) {
    if (this.sceneObjects.length <= 1) return
    this.sceneObjects = filter(this.sceneObjects, (o) => o.id !== id)
    if (this.selectedObjectId === id) {
      this.selectedObjectId = this.sceneObjects[0]?.id ?? null
    }
    this.bumpScene()
  }

  duplicateObject(id: string) {
    const src = find(this.sceneObjects, (o) => o.id === id)
    if (!src) return
    const copy = createDefaultObject({
      ...src,
      id: uuid(),
      x: min(95, src.x + 4),
      y: min(95, src.y + 4),
      shadow: clone(src.shadow),
    })
    this.sceneObjects.push(copy)
    this.selectedObjectId = copy.id
    this.bumpScene()
  }

  updateObject(id: string, patch: Partial<SceneObject>) {
    const obj = find(this.sceneObjects, (o) => o.id === id)
    if (!obj) return
    extend(obj, patch)
    this.bumpScene()
  }

  setObjectDevice(id: string, deviceId: DeviceCategory) {
    if (!getDevice(deviceId)) return
    this.updateObject(id, { deviceId })
  }

  setObjectScreenshot(id: string, url: string | null) {
    const obj = find(this.sceneObjects, (o) => o.id === id)
    if (!obj) return
    if (obj.screenshotUrl && startWith(obj.screenshotUrl, 'blob:')) {
      URL.revokeObjectURL(obj.screenshotUrl)
    }
    this.updateObject(id, { screenshotUrl: url })
  }

  async loadScreenshotForSelected(file: File) {
    const id = this.selectedObjectId
    if (!id) return
    const url = URL.createObjectURL(file)
    this.setObjectScreenshot(id, url)
  }

  async openScreenshotDialog() {
    const result = await openImageFile({ title: i18n.t('openScreenshot') })
    if (!result) return
    await this.loadScreenshotForSelected(result.file)
  }

  setBackgroundType(type: BackgroundType) {
    this.background.type = type
    this.bumpScene()
  }

  setSolidColor(color: string) {
    this.background.solidColor = color
    this.background.type = 'solid'
    this.bumpScene()
  }

  private commitGradient() {
    this.background.type = 'gradient'
    this.background.gradientName = matchGradientPreset(
      this.background.gradientAngle,
      this.background.gradientColors
    )
    this.scheduleGradientPatch()
  }

  setGradient(preset: GradientPreset) {
    this.background.gradientAngle = wrapAngle(preset.angle)
    this.background.gradientColors = clone(preset.colors)
    this.commitGradient()
  }

  setGradientColor(index: number, color: string) {
    const colors = clone(this.background.gradientColors)
    const fallback = gradientPresets[0].colors
    while (colors.length < 2) {
      colors.push(fallback[colors.length] || fallback[0])
    }
    colors[index] = color
    this.background.gradientColors = colors.slice(0, 2)
    this.commitGradient()
  }

  setGradientAngle(angle: number) {
    const next = wrapAngle(angle)
    if (
      this.background.type === 'gradient' &&
      this.background.gradientAngle === next
    ) {
      return
    }
    this.background.gradientAngle = next
    this.commitGradient()
  }

  swapGradientColors() {
    const [start, end] = this.background.gradientColors
    if (!start || !end) return
    this.background.gradientColors = [end, start]
    this.commitGradient()
  }

  setBackgroundImage(url: string | null) {
    if (
      this.background.imageUrl &&
      startWith(this.background.imageUrl, 'blob:')
    ) {
      URL.revokeObjectURL(this.background.imageUrl)
    }
    this.background.imageUrl = url
    this.background.type = 'image'
    this.bumpScene()
  }

  async openBackgroundImageDialog() {
    const result = await openImageFile({ title: i18n.t('openBackground') })
    if (!result) return
    this.setBackgroundImage(URL.createObjectURL(result.file))
  }

  setCanvasSize(size: CanvasSize) {
    this.canvasSize = size
    this.bumpScene()
  }

  setFrameStyle(id: string, frameStyle: FrameStyle) {
    this.updateObject(id, { frameStyle })
  }

  /** Read live leafer transforms into store so a scene rebuild keeps position/scale. */
  syncLiveTransforms() {
    const frame = this.frame
    if (!frame) return
    const { width, height } = this.canvasSize
    if (!width || !height) return

    eachChild(frame, (child) => {
      const obj = find(this.sceneObjects, (o) => o.id === child.id)
      if (!obj) return

      const scaleX = isNum(child.scaleX) ? child.scaleX : 1
      const scaleY = isNum(child.scaleY) ? child.scaleY : 1
      const displayW = (child.width || 0) * scaleX
      const displayH = (child.height || 0) * scaleY
      const pos = clampCenterToCanvas(
        child.x || 0,
        child.y || 0,
        displayW,
        displayH,
        width,
        height
      )
      child.x = pos.x
      child.y = pos.y
      obj.x = (pos.x / width) * 100
      obj.y = (pos.y / height) * 100
      if (isNum(child.rotation)) obj.rotation = child.rotation
      const visualScale = obj.scale * ((scaleX + scaleY) / 2)
      if (visualScale > 0) obj.scale = visualScale
    })
  }

  setShadowEnabled(id: string, enabled: boolean) {
    const obj = find(this.sceneObjects, (o) => o.id === id)
    if (!obj) return
    this.updateObject(id, { shadow: extend(clone(obj.shadow), { enabled }) })
  }

  zoomFit() {
    if (!this.app || !this.frame) return
    this.app.tree.zoom('fit', 40)
  }

  private settingsSnapshot() {
    return [
      this.background.type,
      this.background.solidColor,
      this.background.gradientName,
      this.background.gradientAngle,
      this.background.gradientColors.join(','),
      this.canvasSize.width,
      this.canvasSize.height,
      this.canvasSize.presetName,
    ].join(';')
  }

  private persistSettings() {
    const settings: PersistedSettings = {
      background: omit(clone(this.background), ['imageUrl']),
      canvasSize: clone(this.canvasSize),
    }
    storage.set(STORAGE_SETTINGS, settings)
  }

  private loadStorage() {
    const saved = storage.get(STORAGE_SETTINGS) as PersistedSettings | null
    if (!saved || !isObj(saved)) return

    if (saved.background && isObj(saved.background)) {
      this.applySavedBackground(saved.background)
    }
    if (saved.canvasSize && isObj(saved.canvasSize)) {
      this.applySavedCanvasSize(saved.canvasSize)
    }
  }

  private applySavedBackground(saved: PersistedSettings['background']) {
    if (contain(BACKGROUND_TYPES, saved.type)) {
      this.background.type = saved.type === 'image' ? 'gradient' : saved.type
    }
    if (isStr(saved.solidColor)) {
      this.background.solidColor = saved.solidColor
    }
    if (isNum(saved.gradientAngle)) {
      this.background.gradientAngle = wrapAngle(saved.gradientAngle)
    }
    if (isArr(saved.gradientColors) && saved.gradientColors.length >= 2) {
      this.background.gradientColors = clone(saved.gradientColors).slice(0, 2)
      this.background.gradientName = matchGradientPreset(
        this.background.gradientAngle,
        this.background.gradientColors
      )
    } else if (isStr(saved.gradientName)) {
      this.background.gradientName = saved.gradientName
    }
  }

  private applySavedCanvasSize(saved: CanvasSize) {
    if (!isNum(saved.width) || !isNum(saved.height)) return
    if (saved.width < 1 || saved.height < 1) return
    this.canvasSize = {
      width: Math.round(saved.width),
      height: Math.round(saved.height),
      presetName: isStr(saved.presetName) ? saved.presetName : '',
    }
  }

  async exportImage() {
    if (!this.frame || this.isExporting) return
    this.isExporting = true
    let checker: { visible?: boolean } | undefined
    eachChild(this.frame, (child) => {
      if (child.id === 'checkerboard') checker = child
    })
    const prevVisible = checker?.visible
    try {
      if (checker) checker.visible = false
      if (this.background.type === 'transparent') {
        this.frame.fill = 'transparent'
      }
      const exportResult = await this.frame.export('png', { pixelRatio: 1 })
      const data = exportResult.data as string
      download(data, 'screenshot-mockup.png', 'image/png')
      toast.success(i18n.t('exportSuccess'))
    } catch (err) {
      console.error(err)
      toast.error(i18n.t('exportFailed'))
    } finally {
      if (checker && prevVisible !== undefined) checker.visible = prevVisible
      runInAction(() => {
        this.isExporting = false
      })
    }
  }
}

export default new Store()
