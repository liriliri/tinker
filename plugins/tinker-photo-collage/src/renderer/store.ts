import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

const STORAGE_KEY_CANVAS_BG_COLOR = 'canvasBgColor'
const STORAGE_KEY_IMAGE_BG_COLOR = 'imageBgColor'
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
}

class Store extends BaseStore {
  photos: Photo[] = []
  selectedTemplateId: string = '2-t1b1'
  photoSlots: PhotoSlot[] = []

  padding: number = 42
  spacing: number = 25
  radius: number = 50
  radiusEnabled: boolean = true

  canvasWidth: number = 1000
  canvasHeight: number = 1000

  canvasBgColor: string = '#ffffff'
  imageBgColor: string = '#000000'

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadSettings()
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
    }))
  }

  setPadding(value: number) {
    this.padding = value
  }

  setSpacing(value: number) {
    this.spacing = value
  }

  setRadius(value: number) {
    this.radius = value
  }

  toggleRadius() {
    this.radiusEnabled = !this.radiusEnabled
  }

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width
    this.canvasHeight = height
  }

  setCanvasBgColor(color: string) {
    this.canvasBgColor = color
    storage.set(STORAGE_KEY_CANVAS_BG_COLOR, color)
  }

  setImageBgColor(color: string) {
    this.imageBgColor = color
    storage.set(STORAGE_KEY_IMAGE_BG_COLOR, color)
  }

  clearAll() {
    this.photos.forEach((photo) => URL.revokeObjectURL(photo.url))
    this.photos = []
    this.photoSlots.forEach((slot) => {
      slot.photoId = null
    })
  }
}

const store = new Store()

export default store
