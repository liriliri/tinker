import type { LucideIcon } from 'lucide-react'
import {
  ArrowUp,
  BarChart3,
  Cpu,
  Download,
  HardDrive,
  Heart,
} from 'lucide-react'
import clamp from 'licia/clamp'
import fileSize from 'licia/fileSize'
import type { DataPoint, MetricId } from '../../common/types'
import { formatRate } from './chart'
import { isPercentMetric, isPowerMetric } from './metrics'

export const DASHBOARD_SECTIONS: { labelKey: string; metrics: MetricId[] }[] = [
  {
    labelKey: 'sectionGeneral',
    metrics: ['cpu', 'memActive', 'memUsed', 'diskSpace'],
  },
  { labelKey: 'sectionNetwork', metrics: ['netRx', 'netTx'] },
  { labelKey: 'sectionDisk', metrics: ['diskRx', 'diskWx'] },
  {
    labelKey: 'sectionSystem',
    metrics: ['battery', 'batteryPower', 'cpuTemp', 'cpuSpeed'],
  },
]

export const METRIC_ICONS: Record<MetricId, LucideIcon> = {
  cpu: Cpu,
  memActive: BarChart3,
  memUsed: BarChart3,
  netRx: Download,
  netTx: ArrowUp,
  diskRx: HardDrive,
  diskWx: HardDrive,
  diskSpace: HardDrive,
  battery: Heart,
  batteryPower: Heart,
  cpuTemp: Cpu,
  cpuSpeed: Cpu,
}

export function formatMetricValue(id: MetricId, value: number): string {
  if (id === 'battery') {
    return `${value.toFixed(1)}%`
  }
  if (id === 'batteryPower') {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}W`
  }
  if (id === 'cpuTemp') {
    return `${value.toFixed(1)}°C`
  }
  if (id === 'cpuSpeed') {
    return `${value.toFixed(2)} GHz`
  }
  if (isPercentMetric(id)) {
    return `${value.toFixed(1)}%`
  }
  if (isPowerMetric(id)) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}W`
  }
  return formatRate(value)
}

export function getRingProgress(
  id: MetricId,
  value: number,
  history: number[]
): number {
  if (isPercentMetric(id) || id === 'battery') {
    return clamp(value, 0, 100)
  }
  if (isPowerMetric(id)) {
    const max = Math.max(1, ...history.map(Math.abs))
    return clamp((Math.abs(value) / max) * 100, 0, 100)
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
  if (id === 'memUsed') {
    return `${fileSize(dp.memoryUsed)} / ${fileSize(dp.memoryTotal)}`
  }
  if (id === 'diskSpace' && dp.diskSpaceTotal > 0) {
    return `${fileSize(dp.diskSpaceUsed)} / ${fileSize(dp.diskSpaceTotal)}`
  }
  return undefined
}
