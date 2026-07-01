import fileSize from 'licia/fileSize'
import normalizePath from 'licia/normalizePath'
import rtrim from 'licia/rtrim'
import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'
import { stripFileExt } from '../../common/util'
import type { Book } from '../types'

export function getBookTypeLabel(filePath: string): string {
  const { ext } = splitPath(filePath)
  return ext ? ext.slice(1).toUpperCase() : ''
}

export function getBookDisplayTitle(book: Book): string {
  const { name, ext } = splitPath(book.path)
  if (ext) return stripFileExt(name, ext)
  return stripFileExt(book.title, splitPath(book.title).ext)
}

export function getBookReadPercent(book: Book): number | null {
  if (book.lastOpenedAt === 0 || book.numPages <= 0) return null
  return Math.min(
    100,
    Math.max(0, Math.round((book.lastPage / book.numPages) * 100))
  )
}

export function normalizeScanDir(dir: string): string {
  return rtrim(normalizePath(dir), '/')
}

export function findBookByPath(
  books: Book[],
  filePath: string
): Book | undefined {
  const key = normalizePath(filePath)
  return books.find((book) => normalizePath(book.path) === key)
}

export function isPathUnderScanDirs(filePath: string, dirs: string[]): boolean {
  if (dirs.length === 0) return false
  const normalized = normalizePath(filePath)
  return dirs.some(
    (dir) => normalized === dir || startWith(normalized, `${dir}/`)
  )
}

export function formatFileSize(bytes: number): string {
  return fileSize(bytes)
}
