import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import { alert } from 'share/components/Alert'
import type { PDFDocumentProxy } from 'pdfjs-dist'

class Store extends BaseStore {
  // PDF document
  pdfDoc: PDFDocumentProxy | null = null
  numPages: number = 0
  currentPage: number = 1

  // Zoom and scale
  scale: number = 1.5

  // Loading state
  isLoading: boolean = false

  // File info
  fileName: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
  }

  // Set PDF document
  setPdfDoc(doc: PDFDocumentProxy | null) {
    this.pdfDoc = doc
    if (doc) {
      this.numPages = doc.numPages
      this.currentPage = 1
    } else {
      this.numPages = 0
      this.currentPage = 1
    }
  }

  // Page navigation
  setCurrentPage(page: number) {
    if (page >= 1 && page <= this.numPages) {
      this.currentPage = page
    }
  }

  nextPage() {
    if (this.currentPage < this.numPages) {
      this.currentPage++
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--
    }
  }

  // Zoom controls
  setScale(scale: number) {
    // Round to avoid floating point issues
    const newScale = Math.round(scale * 100) / 100
    if (newScale >= 0.5 && newScale <= 3) {
      this.scale = newScale
    }
  }

  zoomIn() {
    const newScale = this.scale + 0.25
    this.setScale(newScale)
  }

  zoomOut() {
    const newScale = this.scale - 0.25
    this.setScale(newScale)
  }

  resetZoom() {
    this.scale = 1.5
  }

  // Loading state
  setLoading(loading: boolean) {
    this.isLoading = loading
  }

  // File info
  setFileName(name: string) {
    this.fileName = name
  }

  // Error handling
  showError(message: string) {
    alert({ title: 'Error', message })
  }
}

const store = new Store()

export default store
