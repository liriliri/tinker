import { contextBridge } from 'electron'
import type { BookMeta } from '../common/types'
import { readBookMeta } from './book'
import { scanBookFiles } from './scan'

const api = {
  async scanBookFiles(dirs: string[]) {
    return scanBookFiles(dirs)
  },

  async readBookMeta(filePath: string): Promise<BookMeta> {
    return readBookMeta(filePath)
  },
}

contextBridge.exposeInMainWorld('reader', api)

declare global {
  const reader: typeof api
}
