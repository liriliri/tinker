export type MediaType = 'video' | 'audio'

export type VideoCompressionMode = 'crf' | 'bitrate' | 'resolution'
export type AudioCompressionMode = 'bitrate' | 'samplerate'

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

export interface MediaItem {
  id: string
  fileName: string
  filePath: string
  mediaType: MediaType
  originalSize: number
  outputSize: number
  currentSize: number
  estimatedSize: number
  progress: number
  isCompressing: boolean
  isDone: boolean
  outputPath: string | null
  error: string | null
  videoInfo?: VideoInfo
  audioInfo?: AudioInfo
  compressedVideoInfo?: VideoInfo
  compressedAudioInfo?: AudioInfo
}
