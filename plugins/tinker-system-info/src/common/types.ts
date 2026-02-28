import type si from 'systeminformation'

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
