import { contextBridge } from 'electron'
import si from 'systeminformation'
import type { SystemInfoData } from '../common/types'

const api = {
  async getSystemInfo(): Promise<SystemInfoData> {
    try {
      const [
        system,
        cpu,
        mem,
        graphics,
        osInfo,
        diskLayout,
        audio,
        networkInterfaces,
      ] = await Promise.all([
        si.system(),
        si.cpu(),
        si.mem(),
        si.graphics(),
        si.osInfo(),
        si.diskLayout(),
        si.audio(),
        si.networkInterfaces(),
      ])

      return {
        system,
        cpu,
        mem,
        graphics,
        osInfo,
        diskLayout,
        audio,
        networkInterfaces,
      }
    } catch (error) {
      console.error('Failed to get system info:', error)
      throw error
    }
  },
}

contextBridge.exposeInMainWorld('systemInfo', api)

declare global {
  const systemInfo: typeof api
}
