import { contextBridge, clipboard, nativeImage } from 'electron'
import uuid from 'licia/uuid'

// Clipboard item type matching renderer types
type ClipboardType = 'text' | 'image' | 'file'

interface ClipboardItem {
  id: string
  type: ClipboardType
  data: string
  preview?: string
  timestamp: number
}

// Clipboard monitoring
let monitoringInterval: NodeJS.Timeout | null = null
let lastClipboardText = ''
let lastClipboardImage = ''
let onClipboardChangeCallback: ((item: ClipboardItem) => void) | null = null

function generateId(): string {
  return uuid()
}

function createPreview(text: string, maxLength = 200): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function checkClipboard() {
  try {
    // Check for text first (cheaper operation)
    const text = clipboard.readText()
    if (text && text !== lastClipboardText) {
      lastClipboardText = text
      lastClipboardImage = ''
      const item: ClipboardItem = {
        id: generateId(),
        type: 'text',
        data: text,
        preview: createPreview(text),
        timestamp: Date.now(),
      }
      onClipboardChangeCallback?.(item)
      return
    }

    // Check for image
    const image = clipboard.readImage()
    if (!image.isEmpty()) {
      // Use image size as a quick check to avoid expensive toDataURL when possible
      const size = image.getSize()
      const sizeHash = `${size.width}x${size.height}`

      // If size changed or no previous image, definitely need to check
      if (!lastClipboardImage || !lastClipboardImage.startsWith('data:image')) {
        const imageData = image.toDataURL()
        if (imageData !== lastClipboardImage) {
          lastClipboardImage = imageData
          lastClipboardText = ''
          const item: ClipboardItem = {
            id: generateId(),
            type: 'image',
            data: imageData,
            timestamp: Date.now(),
          }
          onClipboardChangeCallback?.(item)
          return
        }
      } else {
        // We have a previous image - need to compare actual content
        // Convert to data URL to check if it changed
        const imageData = image.toDataURL()
        if (imageData !== lastClipboardImage) {
          lastClipboardImage = imageData
          lastClipboardText = ''
          const item: ClipboardItem = {
            id: generateId(),
            type: 'image',
            data: imageData,
            timestamp: Date.now(),
          }
          onClipboardChangeCallback?.(item)
          return
        }
      }
    } else if (lastClipboardImage) {
      // Clipboard was cleared
      lastClipboardImage = ''
    }
  } catch (error) {
    console.error('Error checking clipboard:', error)
  }
}

const api = {
  // Start monitoring clipboard changes
  startMonitoring(callback: (item: ClipboardItem) => void) {
    onClipboardChangeCallback = callback

    // Initialize with current clipboard content
    lastClipboardText = clipboard.readText() || ''
    const image = clipboard.readImage()
    lastClipboardImage = image.isEmpty() ? '' : image.toDataURL()

    // Check every 500ms
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
    }
    monitoringInterval = setInterval(checkClipboard, 500)
  },

  // Stop monitoring
  stopMonitoring() {
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
      monitoringInterval = null
    }
    onClipboardChangeCallback = null
  },

  // Write to clipboard
  writeText(text: string) {
    clipboard.writeText(text)
    lastClipboardText = text
  },

  writeImage(dataUrl: string) {
    try {
      const image = nativeImage.createFromDataURL(dataUrl)
      clipboard.writeImage(image)
      lastClipboardImage = dataUrl
    } catch (error) {
      console.error('Error writing image to clipboard:', error)
      throw error
    }
  },

  // Clear clipboard
  clear() {
    clipboard.clear()
    lastClipboardText = ''
    lastClipboardImage = ''
  },
}

contextBridge.exposeInMainWorld('clipboard', api)

declare global {
  const clipboard: typeof api
}
