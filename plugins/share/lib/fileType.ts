/**
 * Common file extension sets and file type utilities.
 * All extensions are stored WITHOUT the leading dot.
 */

import mime from 'licia/mime'
import splitPath from 'licia/splitPath'

export type FileCategory = 'image' | 'audio' | 'video' | 'document' | 'other'

export const AUDIO_EXTS = new Set([
  'mp3',
  'wav',
  'ogg',
  'flac',
  'm4a',
  'aac',
  'wma',
  'opus',
  'ape',
  'aiff',
  'webm',
])

export const VIDEO_EXTS = new Set([
  'mp4',
  'mkv',
  'avi',
  'mov',
  'webm',
  'flv',
  'wmv',
  'm4v',
  '3gp',
  'ts',
  'ogv',
])

export const IMAGE_EXTS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'svg',
  'tiff',
  'tif',
  'ico',
  'avif',
])

export const CODE_EXTS = new Set([
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  'json',
  'html',
  'htm',
  'css',
  'scss',
  'sass',
  'less',
  'md',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'c',
  'cpp',
  'cc',
  'h',
  'hpp',
  'cs',
  'php',
  'sh',
  'bash',
  'zsh',
  'yaml',
  'yml',
  'xml',
  'sql',
  'swift',
  'kt',
  'dart',
  'lua',
  'toml',
  'ini',
  'vue',
  'svelte',
  'scala',
  'groovy',
  'r',
  'perl',
  'pl',
])

export const TEXT_EXTS = new Set([...CODE_EXTS, 'txt', 'log', 'csv', 'conf'])

export function getMimeTypeFromPath(filePath: string): string {
  const { ext } = splitPath(filePath)
  if (!ext) return ''
  return (mime(ext.slice(1)) as string) || ''
}

export function getFileCategory(filePath: string): FileCategory {
  const mimeType = getMimeTypeFromPath(filePath)
  if (!mimeType) return 'other'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document'
  }
  return 'other'
}
