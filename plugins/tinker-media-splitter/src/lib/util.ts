import durationFormat from 'licia/durationFormat'
import isErr from 'licia/isErr'
import lowerCase from 'licia/lowerCase'
import lpad from 'licia/lpad'
import replaceAll from 'licia/replaceAll'
import rtrim from 'licia/rtrim'
import splitPath from 'licia/splitPath'
import i18n from 'i18next'
import toast from 'react-hot-toast'
import { AUDIO_EXTS, VIDEO_EXTS } from 'share/lib/fileType'

const MEDIA_EXTENSIONS = [...VIDEO_EXTS, ...AUDIO_EXTS].sort()

export function getMediaFileFilter() {
  return {
    name: i18n.t('mediaFilter'),
    extensions: MEDIA_EXTENSIONS,
  }
}

export function trimTrailingSlash(path: string) {
  return rtrim(path, ['/', '\\'])
}

export function isMediaFileName(name: string) {
  const { ext } = splitPath(name)
  const e = lowerCase(ext.slice(1))
  return VIDEO_EXTS.has(e) || AUDIO_EXTS.has(e)
}

export function formatTimecode(seconds: number) {
  const ms = Math.max(0, Math.round(seconds * 1000))
  const formatted = durationFormat(
    ms,
    ms >= 3600_000 ? 'hh:mm:ss.l' : 'mm:ss.l'
  )
  const [body, frac = '0'] = formatted.split('.')
  return `${body}.${lpad(frac, 3, '0')}`
}

export function formatFilenameTime(seconds: number) {
  return replaceAll(formatTimecode(seconds), ':', '.')
}

const SEGMENT_COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-indigo-500',
]

export function segmentColorClass(index: number) {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length]
}

export function showExportError(err: unknown, t: (key: string) => string) {
  const message = isErr(err) ? err.message : String(err)
  if (message === 'NO_SEGMENTS') {
    toast.error(t('noSegments'))
  } else if (message === 'CANCELLED') {
    toast(t('exportCancelled'))
  } else {
    console.error('Failed to export:', err)
    toast.error(t('exportFailed'))
  }
}
