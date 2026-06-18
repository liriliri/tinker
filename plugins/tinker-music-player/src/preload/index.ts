import { contextBridge } from 'electron'
import { scanAudioFiles } from './scan'

const musicPlayerObj = {
  async scanAudioFiles(dirs: string[]) {
    const files = await scanAudioFiles([...dirs])
    return [...files]
  },
}

contextBridge.exposeInMainWorld('musicPlayer', musicPlayerObj)
