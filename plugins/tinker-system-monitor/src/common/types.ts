import type si from 'systeminformation'

export type SystemSnapshot = {
  timestamp: number
  currentLoad: number
  mem: si.Systeminformation.MemData
  osInfo: si.Systeminformation.OsData
  networkStats: si.Systeminformation.NetworkStatsData[]
  fsStats: si.Systeminformation.FsStatsData
  fsSize: si.Systeminformation.FsSizeData[]
  cpuCurrentSpeed: si.Systeminformation.CpuCurrentSpeedData
  cpuTemperature: si.Systeminformation.CpuTemperatureData
  battery: BatterySnapshot
  time: si.Systeminformation.TimeData
  cpuBrand: string
  unavailableMetrics: string[]
}

export type BatterySnapshot = {
  hasBattery: boolean
  isCharging: boolean
  acConnected: boolean
  percent: number
  health: number
  powerRate: number
  powerState: 'charging' | 'discharging' | 'full' | 'idle' | 'none'
  currentCapacity: number
  maxCapacity: number
}

export type DataPoint = {
  cpu: number
  memoryActive: number
  memoryUsed: number
  memoryTotal: number
  networkRx: number
  networkTx: number
  diskRx: number
  diskWx: number
  diskSpaceUse: number
  diskSpaceUsed: number
  diskSpaceTotal: number
  batteryPercent: number
  batteryPower: number
  cpuTemperature: number
  cpuSpeedAvg: number
}

export type DiskSpaceMount = {
  fs: string
  mount: string
  size: number
  used: number
  use: number
}

export type TextMetrics = {
  battery: BatterySnapshot
  cpuTemp: number
  cpuSpeed: { avg: number; min: number; max: number }
  osDistro: string
  hostname: string
  arch: string
  kernel: string
  cpuBrand: string
  memTotal: number
  swapTotal: number
  uptime: number
  diskSpace: DiskSpaceMount[]
}

export type ResourceUsagePayload = {
  history: DataPoint[]
  current: DataPoint
  textMetrics: TextMetrics
  unavailableMetrics: string[]
}

export type MetricId =
  | 'cpu'
  | 'memActive'
  | 'memUsed'
  | 'netRx'
  | 'netTx'
  | 'diskRx'
  | 'diskWx'
  | 'diskSpace'
  | 'battery'
  | 'batteryPower'
  | 'cpuTemp'
  | 'cpuSpeed'
