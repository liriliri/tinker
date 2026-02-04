import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import shuffle from 'licia/shuffle'
import BaseStore from 'share/BaseStore'
import { getTemplatesByPhotoCount, getTemplateById } from './lib/templates'

const STORAGE_KEY_CANVAS_BG_COLOR = 'canvasBgColor'
const STORAGE_KEY_IMAGE_BG_COLOR = 'imageBgColor'
const STORAGE_KEY_TEMPLATE_ID = 'templateId'
const STORAGE_KEY_PHOTO_COUNT = 'photoCount'
const STORAGE_KEY_PADDING = 'padding'
const STORAGE_KEY_SPACING = 'spacing'
const STORAGE_KEY_RADIUS = 'radius'
const STORAGE_KEY_CANVAS_WIDTH = 'canvasWidth'
const STORAGE_KEY_CANVAS_HEIGHT = 'canvasHeight'
const storage = new LocalStore('tinker-photo-collage')

export type Photo = {
  id: string
  url: string
  file: File
}

export type LayoutTemplate = {
  id: string
  photoCount: number
  gridTemplate: string
  gridAreas: string
  areas: string[]
}

export type PhotoSlot = {
  areaName: string
  photoId: string | null
  scale: number
  offsetX: number
  offsetY: number
}

class Store extends BaseStore {
  photos: Photo[] = []
  selectedTemplateId: string = 'quad-grid'
  photoSlots: PhotoSlot[] = []
  selectedPhotoCount: number = 4

  padding: number = 42
  spacing: number = 25
  radius: number = 50

  canvasWidth: number = 1000
  canvasHeight: number = 1000

  canvasBgColor: string = '#ffffff'
  imageBgColor: string = '#808080'
  backgroundImage: string | null = null

  customRowSizes: number[] = []
  customColSizes: number[] = []

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadSettings()

    if (this.photoSlots.length === 0) {
      this.setSelectedPhotoCount(this.selectedPhotoCount)
    }
  }

  loadSettings() {
    const savedCanvasBgColor = storage.get(STORAGE_KEY_CANVAS_BG_COLOR)
    if (savedCanvasBgColor) {
      this.canvasBgColor = savedCanvasBgColor
    }

    const savedImageBgColor = storage.get(STORAGE_KEY_IMAGE_BG_COLOR)
    if (savedImageBgColor) {
      this.imageBgColor = savedImageBgColor
    }

    const savedPhotoCount = storage.get(STORAGE_KEY_PHOTO_COUNT)
    if (savedPhotoCount) {
      this.selectedPhotoCount = parseInt(savedPhotoCount)
    }

    const savedPadding = storage.get(STORAGE_KEY_PADDING)
    if (savedPadding) {
      this.padding = parseInt(savedPadding)
    }

    const savedSpacing = storage.get(STORAGE_KEY_SPACING)
    if (savedSpacing) {
      this.spacing = parseInt(savedSpacing)
    }

    const savedRadius = storage.get(STORAGE_KEY_RADIUS)
    if (savedRadius) {
      this.radius = parseInt(savedRadius)
    }

    const savedCanvasWidth = storage.get(STORAGE_KEY_CANVAS_WIDTH)
    if (savedCanvasWidth) {
      this.canvasWidth = parseInt(savedCanvasWidth)
    }

    const savedCanvasHeight = storage.get(STORAGE_KEY_CANVAS_HEIGHT)
    if (savedCanvasHeight) {
      this.canvasHeight = parseInt(savedCanvasHeight)
    }

    const savedTemplateId = storage.get(STORAGE_KEY_TEMPLATE_ID)
    if (savedTemplateId) {
      const template = getTemplateById(savedTemplateId)
      if (template) {
        this.selectedTemplateId = savedTemplateId
        this.photoSlots = template.areas.map((area) => ({
          areaName: area,
          photoId: null,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
        }))
        this.initializeGridSizes(savedTemplateId)
      } else {
        const templates = getTemplatesByPhotoCount(this.selectedPhotoCount)
        if (templates.length > 0) {
          this.selectedTemplateId = templates[0].id
        }
      }
    }
  }

  addPhotos(files: File[]) {
    const newPhotos = files.map((file) => ({
      id: `photo-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
    }))
    this.photos.push(...newPhotos)
  }

  removePhoto(id: string) {
    const photo = this.photos.find((p) => p.id === id)
    if (photo) {
      URL.revokeObjectURL(photo.url)
    }
    this.photos = this.photos.filter((p) => p.id !== id)

    this.photoSlots.forEach((slot) => {
      if (slot.photoId === id) {
        slot.photoId = null
      }
    })
  }

  setPhotoToSlot(areaName: string, photoId: string | null) {
    const slot = this.photoSlots.find((s) => s.areaName === areaName)
    if (slot) {
      slot.photoId = photoId
    }
  }

  setTemplate(templateId: string, areas: string[]) {
    this.selectedTemplateId = templateId
    this.photoSlots = areas.map((area) => ({
      areaName: area,
      photoId: null,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    }))
    this.initializeGridSizes(templateId)
    storage.set(STORAGE_KEY_TEMPLATE_ID, templateId)
  }

  initializeGridSizes(templateId: string) {
    const template = getTemplateById(templateId)
    if (!template) return

    const [rows, cols] = template.gridTemplate.split(' / ')
    const rowMatch = rows.match(/repeat\((\d+), 1fr\)/)
    const colMatch = cols.match(/repeat\((\d+), 1fr\)/)

    if (rowMatch) {
      const rowCount = parseInt(rowMatch[1])
      this.customRowSizes = Array(rowCount).fill(1)
    }

    if (colMatch) {
      const colCount = parseInt(colMatch[1])
      this.customColSizes = Array(colCount).fill(1)
    }
  }

  setRowSize(index: number, size: number) {
    this.customRowSizes[index] = size
  }

  setColSize(index: number, size: number) {
    this.customColSizes[index] = size
  }

  get customGridTemplate() {
    if (this.customRowSizes.length === 0 || this.customColSizes.length === 0) {
      return null
    }
    const rows = this.customRowSizes.map((size) => `${size}fr`).join(' ')
    const cols = this.customColSizes.map((size) => `${size}fr`).join(' ')
    return `${rows} / ${cols}`
  }

  setSelectedPhotoCount(count: number) {
    this.selectedPhotoCount = count
    const templates = getTemplatesByPhotoCount(count)
    if (templates.length > 0) {
      const firstTemplate = templates[0]
      this.setTemplate(firstTemplate.id, firstTemplate.areas)
    }
    storage.set(STORAGE_KEY_PHOTO_COUNT, count.toString())
  }

  setPadding(value: number) {
    this.padding = value
    storage.set(STORAGE_KEY_PADDING, value.toString())
  }

  setSpacing(value: number) {
    this.spacing = value
    storage.set(STORAGE_KEY_SPACING, value.toString())
  }

  setRadius(value: number) {
    this.radius = value
    storage.set(STORAGE_KEY_RADIUS, value.toString())
  }

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width
    this.canvasHeight = height
    storage.set(STORAGE_KEY_CANVAS_WIDTH, width.toString())
    storage.set(STORAGE_KEY_CANVAS_HEIGHT, height.toString())
  }

  setCanvasBgColor(color: string) {
    this.canvasBgColor = color
    storage.set(STORAGE_KEY_CANVAS_BG_COLOR, color)
  }

  setImageBgColor(color: string) {
    this.imageBgColor = color
    storage.set(STORAGE_KEY_IMAGE_BG_COLOR, color)
  }

  setPhotoScale(areaName: string, scale: number) {
    const slot = this.photoSlots.find((s) => s.areaName === areaName)
    if (slot) {
      slot.scale = scale
    }
  }

  setPhotoOffset(areaName: string, offsetX: number, offsetY: number) {
    const slot = this.photoSlots.find((s) => s.areaName === areaName)
    if (slot) {
      slot.offsetX = offsetX
      slot.offsetY = offsetY
    }
  }

  setBackgroundImage(url: string) {
    this.backgroundImage = url
  }

  clearBackgroundImage() {
    if (this.backgroundImage) {
      URL.revokeObjectURL(this.backgroundImage)
      this.backgroundImage = null
    }
  }

  clearAll() {
    this.photos.forEach((photo) => URL.revokeObjectURL(photo.url))
    this.photos = []
    this.photoSlots.forEach((slot) => {
      slot.photoId = null
    })
  }

  randomize() {
    const assignedPhotoIds = this.photoSlots
      .map((slot) => slot.photoId)
      .filter((id): id is string => id !== null)

    if (assignedPhotoIds.length <= 1) {
      return
    }

    const shuffled = shuffle(assignedPhotoIds)

    let shuffledIndex = 0
    this.photoSlots.forEach((slot) => {
      if (slot.photoId !== null) {
        slot.photoId = shuffled[shuffledIndex]
        shuffledIndex++
      }
    })
  }

  autoFillSlots(photoIds: string[]) {
    const emptySlots = this.photoSlots.filter((slot) => slot.photoId === null)
    photoIds.forEach((photoId, index) => {
      if (index < emptySlots.length) {
        emptySlots[index].photoId = photoId
      }
    })
  }
}

const store = new Store()

export default store
