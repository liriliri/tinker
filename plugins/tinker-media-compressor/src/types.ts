export type MediaType = 'video' | 'audio'

export interface VideoInfo {
  width: number
  height: number
  fps: number
  duration: number
  thumbnail: string
}

export interface AudioInfo {
  duration: number
  codec: string
  sampleRate?: number
  bitrate?: number
}

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
  videoInfo?: VideoInfo
  audioInfo?: AudioInfo
}
