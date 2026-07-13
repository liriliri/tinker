import { contextBridge } from 'electron'
import { scanAudioFiles } from './scan'

const api = {
  async scanAudioFiles(dirs: string[]) {
    const files = await scanAudioFiles([...dirs])
    return [...files]
  },
}

contextBridge.exposeInMainWorld('musicPlayer', api)

declare global {
  const musicPlayer: typeof api
}
