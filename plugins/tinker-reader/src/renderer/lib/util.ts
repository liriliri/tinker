import fileSize from 'licia/fileSize'
import normalizePath from 'licia/normalizePath'
import rtrim from 'licia/rtrim'
import startWith from 'licia/startWith'
import type { Book } from '../types'

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
