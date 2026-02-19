export type MediaType = 'video' | 'audio'

export interface MediaItem {
  id: string
  fileName: string
  filePath: string
  mediaType: MediaType
  originalSize: number
  outputSize: number
  progress: number
  isCompressing: boolean
  isDone: boolean
  outputPath: string | null
  error: string | null
}
