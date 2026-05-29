import compact from 'licia/compact'
import type {
  DataPoint,
  ResourceUsagePayload,
  SystemSnapshot,
  TextMetrics,
} from '../../common/types'
import {
  detectPlatform,
  diskUsePercent,
  getPrimaryDiskMount,
  listUserDiskMounts,
  toDiskSpaceMount,
} from './disk'

const UNAVAILABLE_CHECKERS: Record<string, (s: SystemSnapshot) => boolean> = {
  battery: (s) => !s.battery.hasBattery,
  batteryPower: (s) => !s.battery.hasBattery,
  cpuTemp: (s) => (s.cpuTemperature.main ?? 0) <= 0,
  cpuSpeed: (s) => s.cpuCurrentSpeed.avg <= 0,
}

export function computeUnavailableMetrics(snap: SystemSnapshot): string[] {
  const result: string[] = []
  for (const [key, check] of Object.entries(UNAVAILABLE_CHECKERS)) {
    if (check(snap)) result.push(key)
  }
  return result
}

export function snapshotToDataPoint(snap: SystemSnapshot): DataPoint {
  const platform = detectPlatform(snap.fsSize, snap.osInfo.platform)
  const primary = getPrimaryDiskMount(snap.fsSize, platform)
  const diskSpaceUse = primary ? diskUsePercent(primary.used, primary.size) : 0

  return {
    cpu: snap.currentLoad,
    memoryActive: snap.mem.active,
    memoryUsed: snap.mem.used,
    memoryTotal: snap.mem.total,
    networkRx: snap.networkStats?.[0]?.rx_sec || 0,
    networkTx: snap.networkStats?.[0]?.tx_sec || 0,
    diskRx: snap.fsStats.rx_sec || 0,
    diskWx: snap.fsStats.wx_sec || 0,
    diskSpaceUse,
    diskSpaceUsed: primary?.used ?? 0,
    diskSpaceTotal: primary?.size ?? 0,
    batteryPercent: snap.battery.hasBattery ? snap.battery.percent : -1,
    batteryPower: snap.battery.hasBattery ? snap.battery.powerRate : 0,
    cpuTemperature: snap.cpuTemperature.main ?? 0,
    cpuSpeedAvg: snap.cpuCurrentSpeed.avg,
  }
}

function buildTextMetrics(snap: SystemSnapshot): TextMetrics {
  const platform = detectPlatform(snap.fsSize, snap.osInfo.platform)
  const disks = listUserDiskMounts(snap.fsSize, platform)

  return {
    battery: snap.battery,
    cpuTemp: snap.cpuTemperature.main ?? 0,
    cpuSpeed: {
      avg: snap.cpuCurrentSpeed.avg,
      min: snap.cpuCurrentSpeed.min,
      max: snap.cpuCurrentSpeed.max,
    },
    osDistro: compact([snap.osInfo.distro, snap.osInfo.release]).join(' '),
    hostname: snap.osInfo.hostname || '',
    arch: snap.osInfo.arch || '',
    kernel: snap.osInfo.kernel || '',
    cpuBrand: snap.cpuBrand || '',
    memTotal: snap.mem.total,
    swapTotal: snap.mem.swaptotal,
    uptime: snap.time?.uptime ?? 0,
    diskSpace: disks.map(toDiskSpaceMount),
  }
}

export function buildPayload(
  history: DataPoint[],
  current: DataPoint,
  snap: SystemSnapshot
): ResourceUsagePayload {
  return {
    history,
    current,
    textMetrics: buildTextMetrics(snap),
    unavailableMetrics: snap.unavailableMetrics,
  }
}
