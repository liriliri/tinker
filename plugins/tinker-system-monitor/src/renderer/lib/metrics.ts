import type { DataPoint, MetricId } from '../../common/types'

export const METRIC_COLORS: Record<MetricId, string> = {
  cpu: '#3b82f6',
  memActive: '#0fc25e',
  memUsed: '#22c55e',
  netRx: '#f97316',
  netTx: '#a855f7',
  diskRx: '#eab308',
  diskWx: '#ef4444',
  diskSpace: '#06b6d4',
  battery: '#0fc25e',
  batteryPower: '#84cc16',
  cpuTemp: '#f43f5e',
  cpuSpeed: '#6366f1',
}

export function getHistoryValues(history: DataPoint[], id: MetricId): number[] {
  return history.map((dp) => {
    switch (id) {
      case 'cpu':
        return dp.cpu
      case 'memActive':
        return dp.memoryTotal > 0 ? (dp.memoryActive / dp.memoryTotal) * 100 : 0
      case 'memUsed':
        return dp.memoryTotal > 0 ? (dp.memoryUsed / dp.memoryTotal) * 100 : 0
      case 'netRx':
        return dp.networkRx
      case 'netTx':
        return dp.networkTx
      case 'diskRx':
        return dp.diskRx
      case 'diskWx':
        return dp.diskWx
      case 'diskSpace':
        return dp.diskSpaceUse
      case 'battery':
        return dp.batteryPercent
      case 'batteryPower':
        return dp.batteryPower
      case 'cpuTemp':
        return dp.cpuTemperature
      case 'cpuSpeed':
        return dp.cpuSpeedAvg
      default:
        return 0
    }
  })
}

export function isPercentMetric(id: MetricId): boolean {
  return (
    id === 'cpu' ||
    id === 'memActive' ||
    id === 'memUsed' ||
    id === 'diskSpace' ||
    id === 'battery'
  )
}

export function isPowerMetric(id: MetricId): boolean {
  return id === 'batteryPower'
}
