import dateFormat from 'licia/dateFormat'
import normalizePath from 'licia/normalizePath'
import rtrim from 'licia/rtrim'
import startWith from 'licia/startWith'
import type { Photo } from '../types'

export function normalizeScanDir(dir: string): string {
  return rtrim(normalizePath(dir), '/')
}

export function findPhotoByPath(
  photos: Photo[],
  filePath: string
): Photo | undefined {
  const key = normalizePath(filePath)
  return photos.find((photo) => normalizePath(photo.path) === key)
}

export function isPathUnderScanDirs(filePath: string, dirs: string[]): boolean {
  if (dirs.length === 0) return false
  const normalized = normalizePath(filePath)
  return dirs.some(
    (dir) => normalized === dir || startWith(normalized, `${dir}/`)
  )
}

export function toDateSection(timestamp: number): string {
  return dateFormat(new Date(timestamp), 'yyyy-mm-dd')
}
