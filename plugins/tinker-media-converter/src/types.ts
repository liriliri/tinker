export type MediaType = 'video' | 'audio' | 'image'

export interface VideoInfo {
  codec: string
  width: number
  height: number
  fps: number
  duration: number
  thumbnail: string
  bitrate?: number
}

export interface AudioInfo {
  duration: number
  codec: string
  sampleRate?: number
  bitrate?: number
}

export interface ImageInfo {
  width: number
  height: number
  thumbnail: string
}

export interface MediaItem {
  id: string
  fileName: string
  filePath: string
  mediaType: MediaType
  originalSize: number
  outputSize: number
  progress: number
  isConverting: boolean
  isDone: boolean
  outputPath: string | null
  error: string | null
  videoInfo?: VideoInfo
  audioInfo?: AudioInfo
  imageInfo?: ImageInfo
}
