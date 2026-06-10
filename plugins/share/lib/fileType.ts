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

export const BINARY_EXTS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'ico',
  'webp',
  'tiff',
  'tif',
  'svg',
  'ttf',
  'otf',
  'woff',
  'woff2',
  'eot',
  'zip',
  'tar',
  'gz',
  'bz2',
  'xz',
  '7z',
  'rar',
  'exe',
  'dll',
  'so',
  'dylib',
  'wasm',
  'pdf',
  'class',
  'pyc',
  'o',
  'a',
  'lib',
  'mp3',
  'mp4',
  'wav',
  'avi',
  'mov',
  'mkv',
  'ogg',
  'ogv',
  'webm',
  'flv',
  'db',
  'sqlite',
  'sqlite3',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
])

export function getFileExt(filePath: string): string {
  const { ext } = splitPath(filePath)
  return ext ? ext.slice(1).toLowerCase() : ''
}

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

export const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascriptreact',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescriptreact',
  json: 'json',
  jsonc: 'jsonc',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  sass: 'sass',
  md: 'markdown',
  markdown: 'markdown',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  sh: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  swift: 'swift',
  kt: 'kotlin',
  dart: 'dart',
  lua: 'lua',
  toml: 'properties',
  ini: 'properties',
  vue: 'vue',
  svelte: 'html',
  php: 'php',
  pl: 'perl',
  r: 'r',
  coffee: 'coffeescript',
  clj: 'clojure',
  cljs: 'clojure',
  ex: 'elixir',
  exs: 'elixir',
  elm: 'elm',
  fs: 'fsharp',
  hs: 'haskell',
  jl: 'julia',
  ps1: 'powershell',
  res: 'rescript',
  styl: 'stylus',
  tf: 'terraform',
  tex: 'latex',
  dockerfile: 'dockerfile',
}

export function getLanguage(filePath: string): string {
  const ext = getFileExt(filePath)
  return LANGUAGE_MAP[ext] || 'plaintext'
}
