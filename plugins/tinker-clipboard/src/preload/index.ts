import { contextBridge, clipboard, nativeImage } from 'electron'
import md5 from 'licia/md5'
import { ClipboardItem } from '../common/types'

let monitoringInterval: NodeJS.Timeout | null = null
let lastItemId = ''
let onClipboardChangeCallback: ((item: ClipboardItem) => void) | null = null

function createPreview(text: string, maxLength = 200): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

async function getClipboardItem(): Promise<ClipboardItem | null> {
  try {
    const filePaths = await tinker.getClipboardFilePaths()
    if (filePaths && filePaths.length > 0) {
      const data = JSON.stringify(filePaths)
      const fileNames = filePaths.map((path) => {
        const parts = path.split(/[/\\]/)
        return parts[parts.length - 1]
      })

      return {
        id: md5(data),
        type: 'file',
        data,
        preview: fileNames.join(', '),
        timestamp: Date.now(),
      }
    }

    // Check for image (before text to avoid false positives)
    const image = clipboard.readImage()
    if (!image.isEmpty()) {
      const data = image.toDataURL()
      return {
        id: md5(data),
        type: 'image',
        data,
        timestamp: Date.now(),
      }
    }

    const text = clipboard.readText()
    if (text && text.trim()) {
      return {
        id: md5(text),
        type: 'text',
        data: text,
        preview: createPreview(text),
        timestamp: Date.now(),
      }
    }

    return null
  } catch (error) {
    console.error('Error getting clipboard:', error)
    return null
  }
}

async function checkClipboard() {
  const item = await getClipboardItem()

  if (!item) return

  if (item.id !== lastItemId) {
    lastItemId = item.id
    onClipboardChangeCallback?.(item)
  }
}

const clipboardObj = {
  startMonitoring(callback: (item: ClipboardItem) => void) {
    onClipboardChangeCallback = callback
    lastItemId = ''

    if (monitoringInterval) {
      clearInterval(monitoringInterval)
    }
    monitoringInterval = setInterval(checkClipboard, 500)
  },

  stopMonitoring() {
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
      monitoringInterval = null
    }
    onClipboardChangeCallback = null
  },

  writeText(text: string) {
    clipboard.writeText(text)
    lastItemId = md5(text)
  },

  writeImage(dataUrl: string) {
    try {
      const image = nativeImage.createFromDataURL(dataUrl)
      clipboard.writeImage(image)
      lastItemId = md5(dataUrl)
    } catch (error) {
      console.error('Error writing image to clipboard:', error)
      throw error
    }
  },

  writeFiles(filesJson: string) {
    try {
      const filePaths = JSON.parse(filesJson) as string[]
      clipboard.writeText(filePaths.join('\n'))
      lastItemId = md5(filesJson)
    } catch (error) {
      console.error('Error writing files to clipboard:', error)
      throw error
    }
  },

  clear() {
    clipboard.clear()
    lastItemId = ''
  },
}

contextBridge.exposeInMainWorld('clipboard', clipboardObj)

declare global {
  const clipboard: typeof clipboardObj
}
