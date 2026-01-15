import { contextBridge, clipboard, nativeImage } from 'electron'
import * as fs from 'fs'

const imageCropperObj = {
  async readFile(filePath: string): Promise<Buffer> {
    return fs.promises.readFile(filePath)
  },

  async writeFile(filePath: string, buffer: Uint8Array): Promise<void> {
    await fs.promises.writeFile(filePath, Buffer.from(buffer))
  },

  async copyImageToClipboard(buffer: Uint8Array): Promise<void> {
    const image = nativeImage.createFromBuffer(Buffer.from(buffer))
    clipboard.writeImage(image)
  },
}

contextBridge.exposeInMainWorld('imageCropper', imageCropperObj)

// Buffer will be serialized to Uint8Array when crossing context bridge
declare global {
  const imageCropper: {
    readFile(filePath: string): Promise<Uint8Array>
    writeFile(filePath: string, buffer: Uint8Array): Promise<void>
    copyImageToClipboard(buffer: Uint8Array): Promise<void>
  }
}
