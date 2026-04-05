import { contextBridge } from 'electron'
import { createReadStream } from 'fs'
import { createHash } from 'crypto'

const ONE_MB = 1024 * 1024

const duplicateCleanerObj = {
  calculateMD5(filePath: string, fileSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('md5')
      const end = fileSize > ONE_MB ? ONE_MB - 1 : undefined
      const stream = createReadStream(filePath, {
        start: 0,
        end,
      })

      stream.on('data', (chunk) => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', (err) => reject(err))
    })
  },
}

contextBridge.exposeInMainWorld('duplicateCleaner', duplicateCleanerObj)

declare global {
  const duplicateCleaner: typeof duplicateCleanerObj
}
