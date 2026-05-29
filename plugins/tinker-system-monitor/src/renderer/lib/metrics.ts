import type { DataPoint, MetricId } from '../../common/types'

export const METRIC_COLORS: Record<MetricId, string> = {
  cpu: '#3b82f6',
  memActive: '#0fc25e',
  netRx: '#f97316',
  netTx: '#a855f7',
  diskRx: '#eab308',
  diskWx: '#ef4444',
}

export interface MetricSample {
  timestamp: number
  value: number
}

export function getMetricValue(dp: DataPoint, id: MetricId): number {
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
}

export function getHistoryValues(history: DataPoint[], id: MetricId): number[] {
  return history.map((dp) => getMetricValue(dp, id))
}

export function historyToSamples(
  history: DataPoint[],
  id: MetricId,
  interval: number
): MetricSample[] {
  const now = performance.now()
  return history.map((dp, index) => ({
    timestamp: dp.timestamp ?? now - (history.length - 1 - index) * interval,
    value: getMetricValue(dp, id),
  }))
}

export function isPercentMetric(id: MetricId): boolean {
  return id === 'cpu' || id === 'memActive'
}
