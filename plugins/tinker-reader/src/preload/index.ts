import { contextBridge } from 'electron'
import type { BookMeta } from '../common/types'
import { readBookMeta } from './book'
import { scanBookFiles } from './scan'

const readerObj = {
  async scanBookFiles(dirs: string[]) {
    return scanBookFiles(dirs)
  },

  async readBookMeta(filePath: string): Promise<BookMeta> {
    return readBookMeta(filePath)
  },
}

contextBridge.exposeInMainWorld('reader', readerObj)

declare global {
  const reader: typeof readerObj
}
