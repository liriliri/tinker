import { contextBridge } from 'electron'
import * as zip from './lib/zip'
import type { IArchiveEntry } from '../common/types'

const api = {
  open(filePath: string) {
    zip.open(filePath)
  },

  create(filePath: string) {
    zip.create(filePath)
  },

  close() {
    zip.close()
  },

  listDir(dirPath: string): IArchiveEntry[] {
    return zip.listDir(dirPath)
  },

  dirname(entryPath: string): string {
    return zip.dirname(entryPath)
  },

  addFiles(filePaths: string[], destDir: string) {
    zip.addFiles(filePaths, destDir)
  },

  createFolder(dirPath: string) {
    zip.createFolder(dirPath)
  },

  deleteEntries(entryPaths: string[]) {
    zip.deleteEntries(entryPaths)
  },

  extractEntries(entryPaths: string[], destDir: string) {
    zip.extractEntries(entryPaths, destDir)
  },

  extractAll(destDir: string) {
    zip.extractAll(destDir)
  },

  entryExists(entryPath: string): boolean {
    return zip.entryExists(entryPath)
  },
}

contextBridge.exposeInMainWorld('archive', api)

declare global {
  const archive: typeof api
}
