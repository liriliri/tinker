import type { DataPoint, MetricId } from '../../common/types'

export const METRIC_COLORS: Record<MetricId, string> = {
  cpu: '#3b82f6',
  memActive: '#0fc25e',
  netRx: '#f97316',
  netTx: '#a855f7',
  diskRx: '#eab308',
  diskWx: '#ef4444',
}

export function getHistoryValues(history: DataPoint[], id: MetricId): number[] {
  return history.map((dp) => {
    switch (id) {
      case 'cpu':
        return dp.cpu
      case 'memActive':
        return dp.memoryTotal > 0 ? (dp.memoryActive / dp.memoryTotal) * 100 : 0
      case 'netRx':
        return dp.networkRx
      case 'netTx':
        return dp.networkTx
      case 'diskRx':
        return dp.diskRx
      case 'diskWx':
        return dp.diskWx
      default:
        return 0
    }
  })
}

export function isPercentMetric(id: MetricId): boolean {
  return id === 'cpu' || id === 'memActive'
}
