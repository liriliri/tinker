import filter from 'licia/filter'
import find from 'licia/find'
import sortBy from 'licia/sortBy'
import type { DiskSpaceMount } from '../../common/types'
import type { Systeminformation } from 'systeminformation'

type FsSizeEntry = Systeminformation.FsSizeData

const DARWIN_HIDDEN_MOUNTS = new Set([
  '/System/Volumes/VM',
  '/System/Volumes/Preboot',
  '/System/Volumes/Update',
  '/System/Volumes/xarts',
  '/System/Volumes/iSCPreboot',
  '/System/Volumes/Hardware',
])

export function diskUsePercent(used: number, size: number): number {
  return size > 0 ? (used / size) * 100 : 0
}

export function detectPlatform(
  fsSize: FsSizeEntry[],
  osPlatform: string
): string {
  if (osPlatform) return osPlatform
  if (fsSize.some((d) => d.mount.startsWith('/System/Volumes'))) {
    return 'darwin'
  }
  if (fsSize.some((d) => /^[A-Z]:$/i.test(d.mount))) return 'win32'
  return 'linux'
}

function hasDarwinDataVolume(fsSize: FsSizeEntry[]): boolean {
  return fsSize.some((d) => d.mount === '/System/Volumes/Data' && d.size > 0)
}

function isUserFacingMount(
  disk: FsSizeEntry,
  platform: string,
  fsSize: FsSizeEntry[]
): boolean {
  if (disk.size <= 0) return false

  if (platform === 'darwin') {
    if (DARWIN_HIDDEN_MOUNTS.has(disk.mount)) return false
    if (
      disk.mount.startsWith('/System/Volumes/') &&
      disk.mount !== '/System/Volumes/Data'
    ) {
      return false
    }
    if (disk.mount === '/System/Volumes/Data') return true
    if (disk.mount.startsWith('/Volumes/')) return true
    if (disk.mount === '/') return !hasDarwinDataVolume(fsSize)
    return false
  }

  if (platform === 'win32') {
    return /^[A-Z]:$/i.test(disk.mount)
  }

  if (
    disk.mount.startsWith('/snap') ||
    disk.mount.startsWith('/boot/efi') ||
    disk.mount.startsWith('/proc') ||
    disk.mount.startsWith('/dev')
  ) {
    return false
  }

  return (
    disk.mount === '/' ||
    disk.mount.startsWith('/mnt/') ||
    disk.mount.startsWith('/media/')
  )
}

export function listUserDiskMounts(
  fsSize: FsSizeEntry[],
  platform: string
): FsSizeEntry[] {
  return sortBy(
    filter(fsSize, (d) => isUserFacingMount(d, platform, fsSize)),
    (d) => d.mount
  )
}

export function getPrimaryDiskMount(
  fsSize: FsSizeEntry[],
  platform: string
): FsSizeEntry | null {
  const mounts = listUserDiskMounts(fsSize, platform)

  if (platform === 'darwin') {
    return (
      find(mounts, (d) => d.mount === '/System/Volumes/Data') ??
      find(mounts, (d) => d.mount === '/') ??
      mounts[0] ??
      null
    )
  }

  if (platform === 'win32') {
    return find(mounts, (d) => /^C:$/i.test(d.mount)) ?? mounts[0] ?? null
  }

  return find(mounts, (d) => d.mount === '/') ?? mounts[0] ?? null
}

export function toDiskSpaceMount(disk: FsSizeEntry): DiskSpaceMount {
  return {
    fs: disk.fs,
    mount: disk.mount,
    size: disk.size,
    used: disk.used,
    use: diskUsePercent(disk.used, disk.size),
  }
}
