import AdmZip from 'adm-zip'
import fs from 'fs-extra'
import * as path from 'path'
import filter from 'licia/filter'
import map from 'licia/map'
import each from 'licia/each'
import some from 'licia/some'
import startWith from 'licia/startWith'
import endWith from 'licia/endWith'
import contain from 'licia/contain'
import type { IArchiveEntry } from '../../common/types'

let zip: AdmZip | null = null
let archivePath: string | null = null

function normalizeZipPath(entryPath: string): string {
  return entryPath.replace(/\\/g, '/')
}

function ensureTrailingSlash(dirPath: string): string {
  if (!dirPath) return ''
  return endWith(dirPath, '/') ? dirPath : `${dirPath}/`
}

function stripTrailingSlash(dirPath: string): string {
  if (!dirPath || dirPath === '/') return ''
  return endWith(dirPath, '/') ? dirPath.slice(0, -1) : dirPath
}

function entryMtimeMs(entry: AdmZip.IZipEntry): number {
  return entry.header.time.getTime()
}

function requireZip(): AdmZip {
  if (!zip || !archivePath) {
    throw new Error('No archive is open')
  }
  return zip
}

function save() {
  const current = requireZip()
  current.writeZip(archivePath!)
}

function matchesTarget(name: string, target: string): boolean {
  if (endWith(target, '/')) {
    return name === target || startWith(name, target)
  }
  return name === target
}

export function open(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Archive not found')
  }
  zip = new AdmZip(filePath)
  archivePath = filePath
}

export function create(filePath: string) {
  const dir = path.dirname(filePath)
  fs.ensureDirSync(dir)
  zip = new AdmZip()
  archivePath = filePath
  save()
}

export function close() {
  zip = null
  archivePath = null
}

export function listDir(dirPath: string): IArchiveEntry[] {
  const current = requireZip()
  const prefix = ensureTrailingSlash(normalizeZipPath(dirPath))
  const dirs = new Map<string, IArchiveEntry>()
  const files: IArchiveEntry[] = []

  each(current.getEntries(), (entry) => {
    const name = normalizeZipPath(entry.entryName)
    if (prefix && !startWith(name, prefix)) return

    const rest = prefix ? name.slice(prefix.length) : name
    if (!rest) return

    const slashIndex = rest.indexOf('/')
    if (slashIndex === -1) {
      if (entry.isDirectory) return
      files.push({
        name: rest,
        path: name,
        isDirectory: false,
        size: entry.header.size,
        mtimeMs: entryMtimeMs(entry),
      })
      return
    }

    const dirName = rest.slice(0, slashIndex)
    if (!dirs.has(dirName)) {
      dirs.set(dirName, {
        name: dirName,
        path: `${prefix}${dirName}/`,
        isDirectory: true,
        size: 0,
        mtimeMs: entryMtimeMs(entry),
      })
    }
  })

  return [...dirs.values(), ...files]
}

export function dirname(entryPath: string): string {
  const normalized = stripTrailingSlash(normalizeZipPath(entryPath))
  if (!normalized) return ''
  const index = normalized.lastIndexOf('/')
  if (index < 0) return ''
  return `${normalized.slice(0, index)}/`
}

export function addFiles(filePaths: string[], destDir: string) {
  const current = requireZip()
  const zipDir = ensureTrailingSlash(normalizeZipPath(destDir))

  each(filePaths, (filePath) => {
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      const folderName = path.basename(filePath)
      current.addLocalFolder(filePath, `${zipDir}${folderName}`)
    } else if (stat.isFile()) {
      current.addLocalFile(filePath, zipDir)
    }
  })

  save()
}

export function createFolder(dirPath: string) {
  const current = requireZip()
  const folderPath = ensureTrailingSlash(normalizeZipPath(dirPath))
  if (!folderPath) {
    throw new Error('Invalid folder path')
  }

  const exists = some(current.getEntries(), (entry) => {
    const name = normalizeZipPath(entry.entryName)
    return name === folderPath || startWith(name, folderPath)
  })
  if (exists) {
    throw new Error('Folder already exists')
  }

  current.addFile(folderPath, Buffer.alloc(0))
  save()
}

export function deleteEntries(entryPaths: string[]) {
  const current = requireZip()
  const targets = map(entryPaths, (entryPath) => normalizeZipPath(entryPath))

  const toDelete = filter(current.getEntries(), (entry) => {
    const name = normalizeZipPath(entry.entryName)
    return some(targets, (target) => matchesTarget(name, target))
  })

  each(toDelete, (entry) => {
    current.deleteFile(entry.entryName)
  })

  save()
}

export function extractEntries(entryPaths: string[], destDir: string) {
  const current = requireZip()
  fs.ensureDirSync(destDir)

  const targets = map(entryPaths, (entryPath) => normalizeZipPath(entryPath))

  each(current.getEntries(), (entry) => {
    const name = normalizeZipPath(entry.entryName)
    if (!some(targets, (target) => matchesTarget(name, target))) return
    current.extractEntryTo(entry, destDir, true, true)
  })
}

export function extractAll(destDir: string) {
  const current = requireZip()
  fs.ensureDirSync(destDir)
  current.extractAllTo(destDir, true)
}

export function entryExists(entryPath: string): boolean {
  const current = requireZip()
  const target = normalizeZipPath(entryPath)
  return contain(
    map(current.getEntries(), (entry) => normalizeZipPath(entry.entryName)),
    target
  )
}
