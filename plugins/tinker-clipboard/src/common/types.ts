export type ClipboardType = 'text' | 'image' | 'file'

export interface ClipboardItem {
  id: string
  type: ClipboardType
  data: string // For text: plain text, For image: base64, For file: JSON stringified file paths
  preview?: string // Preview text (first 200 chars for text, file names for files)
  timestamp: number
}
