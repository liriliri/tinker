import { makeAutoObservable, reaction } from 'mobx'
import BaseStore from 'share/BaseStore'
import { alert } from 'share/components/Alert'
import type { PDFDocumentProxy } from 'pdfjs-dist'

class Store extends BaseStore {
  // PDF document
  pdfDoc: PDFDocumentProxy | null = null
  numPages: number = 0
  currentPage: number = 1

  // Zoom and scale
  scale: number = 1.0

  // Loading state
  isLoading: boolean = false

  // File info
  fileName: string = ''

  // Scroll trigger for programmatic navigation
  scrollToPage: number = 0

  // Container width for auto-fit calculation
  containerWidth: number = 0

  // Track if user has manually changed scale
  userHasZoomed: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.bindEvent()
  }

  private bindEvent() {
    // Automatically update title when fileName changes
    reaction(
      () => this.fileName,
      (fileName) => {
        tinker.setTitle(fileName || '')
      }
    )
  }

  // Set PDF document
  setPdfDoc(doc: PDFDocumentProxy | null) {
    this.pdfDoc = doc
    if (doc) {
      this.numPages = doc.numPages
      this.currentPage = 1
      this.userHasZoomed = false // Reset zoom flag for new document
    } else {
      this.numPages = 0
      this.currentPage = 1
      this.userHasZoomed = false
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
      this.scrollToPage = this.currentPage
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--
      this.scrollToPage = this.currentPage
    }
  }

  // Zoom controls
  setScale(scale: number, isUserAction: boolean = false) {
    // Round to avoid floating point issues
    const newScale = Math.round(scale * 100) / 100
    if (newScale >= 0.5 && newScale <= 3) {
      this.scale = newScale
      if (isUserAction) {
        this.userHasZoomed = true
      }
    }
  }

  zoomIn() {
    const newScale = this.scale + 0.25
    this.setScale(newScale, true) // Mark as user action
  }

  zoomOut() {
    const newScale = this.scale - 0.25
    this.setScale(newScale, true) // Mark as user action
  }

  resetZoom() {
    this.scale = 1.0
    this.userHasZoomed = true // Mark as user action
  }

  setContainerWidth(width: number) {
    this.containerWidth = width
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
