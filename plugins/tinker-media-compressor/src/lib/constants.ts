export const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.webm',
])
export const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.m4a',
  '.aac',
  '.ogg',
  '.flac',
  '.wav',
])

export const SUPPORTED_EXTENSIONS = new Set([
  ...VIDEO_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
])

// CRF presets for H.264/VP9: lower value = higher quality (0-51, typical 18-28)
export const VIDEO_CRF_PRESETS = [35, 28, 23, 18, 15]

// Quality percentage presets used for both bitrate and resolution modes
export const VIDEO_QUALITY_PERCENTAGES = [30, 50, 70, 85, 95]

// Audio bitrate presets
export const AUDIO_BITRATE_PRESETS = ['64k', '96k', '128k', '192k', '320k']

// Audio sample rate presets
export const AUDIO_SAMPLERATE_PRESETS = [22050, 32000, 44100, 48000, 96000]

// Audio bitrate presets for samplerate mode (matched to quality levels)
export const AUDIO_SAMPLERATE_BITRATES = ['96k', '128k', '192k', '256k', '320k']
