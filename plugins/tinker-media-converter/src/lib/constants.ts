export const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.webm',
  '.flv',
  '.wmv',
  '.m4v',
  '.3gp',
  '.ts',
])

export const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.m4a',
  '.aac',
  '.ogg',
  '.flac',
  '.wav',
  '.wma',
  '.opus',
  '.ape',
  '.aiff',
])

export const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.bmp',
  '.tiff',
  '.tif',
  '.gif',
  '.ico',
  '.avif',
])

export interface VideoFormat {
  value: string
  ext: string
  codec: string
  label: string
}

export const VIDEO_OUTPUT_FORMATS: VideoFormat[] = [
  // MP4
  { value: 'mp4-h264', ext: 'mp4', codec: 'h264', label: 'MP4 (H.264)' },
  { value: 'mp4-h265', ext: 'mp4', codec: 'h265', label: 'MP4 (H.265)' },
  { value: 'mp4-av1', ext: 'mp4', codec: 'av1', label: 'MP4 (AV1)' },
  // MKV
  { value: 'mkv-h264', ext: 'mkv', codec: 'h264', label: 'MKV (H.264)' },
  { value: 'mkv-h265', ext: 'mkv', codec: 'h265', label: 'MKV (H.265)' },
  { value: 'mkv-vp9', ext: 'mkv', codec: 'vp9', label: 'MKV (VP9)' },
  { value: 'mkv-av1', ext: 'mkv', codec: 'av1', label: 'MKV (AV1)' },
  // WebM
  { value: 'webm-vp9', ext: 'webm', codec: 'vp9', label: 'WebM (VP9)' },
  { value: 'webm-vp8', ext: 'webm', codec: 'vp8', label: 'WebM (VP8)' },
  { value: 'webm-av1', ext: 'webm', codec: 'av1', label: 'WebM (AV1)' },
  // MOV
  { value: 'mov-h264', ext: 'mov', codec: 'h264', label: 'MOV (H.264)' },
  { value: 'mov-h265', ext: 'mov', codec: 'h265', label: 'MOV (H.265)' },
  { value: 'mov-prores', ext: 'mov', codec: 'prores', label: 'MOV (ProRes)' },
  // AVI
  { value: 'avi-h264', ext: 'avi', codec: 'h264', label: 'AVI (H.264)' },
  { value: 'avi-xvid', ext: 'avi', codec: 'xvid', label: 'AVI (Xvid)' },
  { value: 'avi-mpeg4', ext: 'avi', codec: 'mpeg4', label: 'AVI (MPEG-4)' },
  // FLV
  { value: 'flv-h264', ext: 'flv', codec: 'h264', label: 'FLV (H.264)' },
  {
    value: 'flv-sorenson',
    ext: 'flv',
    codec: 'sorenson',
    label: 'FLV (Sorenson Spark)',
  },
  // TS
  { value: 'ts-h264', ext: 'ts', codec: 'h264', label: 'TS (H.264)' },
  { value: 'ts-h265', ext: 'ts', codec: 'h265', label: 'TS (H.265)' },
  // WMV
  { value: 'wmv', ext: 'wmv', codec: 'wmv2', label: 'WMV' },
  // 3GP
  { value: '3gp', ext: '3gp', codec: 'h263', label: '3GP (H.263)' },
  // GIF
  { value: 'gif', ext: 'gif', codec: 'gif', label: 'GIF' },
]

// Maps ffprobe codec_name to our internal codec identifier
export const FFPROBE_CODEC_MAP: Record<string, string> = {
  h264: 'h264',
  avc1: 'h264',
  hevc: 'h265',
  vp9: 'vp9',
  vp8: 'vp8',
  av1: 'av1',
  prores: 'prores',
  mpeg4: 'mpeg4',
  msmpeg4v3: 'mpeg4',
  flv1: 'sorenson',
  wmv2: 'wmv2',
  h263: 'h263',
  gif: 'gif',
}

export const AUDIO_OUTPUT_FORMATS = [
  'mp3',
  'm4a',
  'aac',
  'ogg',
  'flac',
  'wav',
  'opus',
]
export const IMAGE_OUTPUT_FORMATS = [
  'jpg',
  'png',
  'webp',
  'bmp',
  'tiff',
  'avif',
]
