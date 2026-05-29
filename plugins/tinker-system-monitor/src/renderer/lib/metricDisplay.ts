import type { LucideIcon } from 'lucide-react'
import { ArrowUp, BarChart3, Cpu, Download, HardDrive } from 'lucide-react'
import clamp from 'licia/clamp'
import fileSize from 'licia/fileSize'
import type { DataPoint, MetricId } from '../../common/types'
import { formatRate } from './chart'
import { isPercentMetric } from './metrics'

export const DASHBOARD_METRICS: MetricId[] = [
  'cpu',
  'memActive',
  'netRx',
  'netTx',
  'diskRx',
  'diskWx',
]

export const METRIC_ICONS: Record<MetricId, LucideIcon> = {
  cpu: Cpu,
  memActive: BarChart3,
  netRx: Download,
  netTx: ArrowUp,
  diskRx: HardDrive,
  diskWx: HardDrive,
}

export function formatMetricValue(id: MetricId, value: number): string {
  if (isPercentMetric(id)) {
    return `${value.toFixed(1)}%`
  }
  return formatRate(value)
}

export function getRingProgress(
  id: MetricId,
  value: number,
  history: number[]
): number {
  if (isPercentMetric(id)) {
    return clamp(value, 0, 100)
  }
  const max = Math.max(1, ...history)
  return max > 0 ? clamp((value / max) * 100, 0, 100) : 0
}

export function getMetricDetail(
  id: MetricId,
  dp: DataPoint | undefined
): string | undefined {
  if (!dp) return undefined
  if (id === 'memActive') {
    return `${fileSize(dp.memoryActive)} / ${fileSize(dp.memoryTotal)}`
  }
  return undefined
}
