import type { ReactNode } from 'react'

export interface PhotoViewerItem {
  id: string
  title: string
  width: number
  height: number
}

export interface PhotoViewerLabels {
  closeViewer: string
  prevPhoto: string
  nextPhoto: string
  previewLoadFailed: string
}

export interface PhotoViewerProps<T extends PhotoViewerItem> {
  open: boolean
  items: T[]
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
  labels: PhotoViewerLabels
  getThumbnailUrl: (item: T) => Promise<string | null>
  getPreviewUrl: (item: T) => Promise<string | null>
  prefetchPreview?: (item: T) => void
  renderSidebar?: (item: T) => ReactNode
}
