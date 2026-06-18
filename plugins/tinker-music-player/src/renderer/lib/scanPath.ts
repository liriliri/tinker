import normalizePath from 'licia/normalizePath'
import type { Track } from './db'

export function normalizeScanDir(dir: string): string {
  return normalizePath(dir).replace(/\/$/, '')
}

export function findTrackByPath(
  tracks: Track[],
  filePath: string
): Track | undefined {
  const key = normalizePath(filePath)
  return tracks.find((track) => normalizePath(track.path) === key)
}

export function isPathUnderScanDirs(filePath: string, dirs: string[]): boolean {
  if (dirs.length === 0) return false
  const normalized = normalizePath(filePath)
  return dirs.some(
    (dir) => normalized === dir || normalized.startsWith(`${dir}/`)
  )
}
