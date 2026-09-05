export interface MediaFile {
  filePath: string
  fileName: string
  src: string
  duration: number
  size: number
  hasVideo: boolean
  hasAudio: boolean
  width: number
  height: number
}

export interface Segment {
  id: string
  start: number
  end: number
}

export interface SegmentToExport {
  id: string
  start: number
  end: number
  index: number
}
