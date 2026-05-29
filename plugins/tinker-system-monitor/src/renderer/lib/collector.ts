import type {
  DataPoint,
  ResourceUsagePayload,
  SystemSnapshot,
  TextMetrics,
} from '../../common/types'
import { detectPlatform, listUserDiskMounts, toDiskSpaceMount } from './disk'

export function snapshotToDataPoint(snap: SystemSnapshot): DataPoint {
  return {
    cpu: snap.currentLoad,
    memoryActive: snap.mem.active,
    memoryTotal: snap.mem.total,
    networkRx: snap.networkStats?.[0]?.rx_sec || 0,
    networkTx: snap.networkStats?.[0]?.tx_sec || 0,
    diskRx: snap.fsStats.rx_sec || 0,
    diskWx: snap.fsStats.wx_sec || 0,
  }
}

function buildTextMetrics(snap: SystemSnapshot): TextMetrics {
  const platform = detectPlatform(snap.fsSize, snap.osInfo.platform)
  const disks = listUserDiskMounts(snap.fsSize, platform)

  return {
    diskSpace: disks.map(toDiskSpaceMount),
    battery: snap.battery,
    uptime: snap.uptime,
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
  }
}
