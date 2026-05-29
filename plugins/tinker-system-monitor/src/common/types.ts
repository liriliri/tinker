import type si from 'systeminformation'

export type SystemSnapshot = {
  timestamp: number
  currentLoad: number
  mem: si.Systeminformation.MemData
  osInfo: si.Systeminformation.OsData
  networkStats: si.Systeminformation.NetworkStatsData[]
  fsStats: si.Systeminformation.FsStatsData
  fsSize: si.Systeminformation.FsSizeData[]
  battery: BatteryInfo
  uptime: number
}

export type BatteryInfo = {
  hasBattery: boolean
  percent: number
}

export type DataPoint = {
  cpu: number
  memoryActive: number
  memoryTotal: number
  networkRx: number
  networkTx: number
  diskRx: number
  diskWx: number
}

export type DiskSpaceMount = {
  fs: string
  mount: string
  size: number
  used: number
  use: number
}

export type TextMetrics = {
  diskSpace: DiskSpaceMount[]
  battery: BatteryInfo
  uptime: number
}

export type ResourceUsagePayload = {
  history: DataPoint[]
  current: DataPoint
  textMetrics: TextMetrics
}

export type MetricId =
  | 'cpu'
  | 'memActive'
  | 'netRx'
  | 'netTx'
  | 'diskRx'
  | 'diskWx'
