import { contextBridge } from 'electron'
import si from 'systeminformation'

export type SystemInfoData = {
  system?: si.Systeminformation.SystemData
  cpu?: si.Systeminformation.CpuData
  mem?: si.Systeminformation.MemData
  graphics?: si.Systeminformation.GraphicsData
  osInfo?: si.Systeminformation.OsData
  diskLayout?: si.Systeminformation.DiskLayoutData[]
  audio?: si.Systeminformation.AudioData[]
  networkInterfaces?: si.Systeminformation.NetworkInterfacesData[]
}

const systemInfoObj = {
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

contextBridge.exposeInMainWorld('systemInfo', systemInfoObj)

declare global {
  const systemInfo: typeof systemInfoObj
}
