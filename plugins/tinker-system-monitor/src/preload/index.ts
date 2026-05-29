import { contextBridge } from 'electron'
import si from 'systeminformation'
import type { Systeminformation } from 'systeminformation'
import type { BatterySnapshot, SystemSnapshot } from '../common/types'

const emptyMem = (): Systeminformation.MemData => ({
  total: 0,
  free: 0,
  used: 0,
  active: 0,
  available: 0,
  buffcache: 0,
  buffers: 0,
  cached: 0,
  slab: 0,
  reclaimable: 0,
  swaptotal: 0,
  swapused: 0,
  swapfree: 0,
  writeback: null,
  dirty: null,
})

const emptyOs = (): Systeminformation.OsData => ({
  platform: '',
  distro: '',
  release: '',
  codename: '',
  kernel: '',
  arch: '',
  hostname: '',
  fqdn: '',
  codepage: '',
  logofile: '',
  serial: '',
  build: '',
  servicepack: '',
  uefi: false,
})

const emptyFsStats = (): Systeminformation.FsStatsData => ({
  rx: 0,
  wx: 0,
  tx: 0,
  rx_sec: null,
  wx_sec: null,
  tx_sec: null,
  ms: 0,
})

const emptyBattery = (): BatterySnapshot => ({
  hasBattery: false,
  isCharging: false,
  acConnected: false,
  percent: 0,
  health: 0,
  powerRate: 0,
  powerState: 'none',
  currentCapacity: 0,
  maxCapacity: 0,
})

function mapBattery(
  bat: Systeminformation.BatteryData | null,
  prev: BatterySnapshot | undefined
): BatterySnapshot {
  if (!bat) {
    return prev ?? emptyBattery()
  }
  return {
    hasBattery: bat.hasBattery,
    isCharging: bat.isCharging ?? false,
    acConnected: bat.acConnected ?? false,
    percent: bat.percent ?? 0,
    health:
      bat.maxCapacity && bat.designedCapacity
        ? (bat.maxCapacity / bat.designedCapacity) * 100
        : 0,
    powerRate: 0,
    powerState: bat.isCharging
      ? 'charging'
      : bat.hasBattery
      ? 'discharging'
      : 'none',
    currentCapacity: bat.currentCapacity ?? 0,
    maxCapacity: bat.maxCapacity ?? 0,
  }
}

let cachedCpuBrand = ''

async function collectSnapshot(
  prev: SystemSnapshot | null
): Promise<SystemSnapshot> {
  const [cl, mem, os, ns, fs, fsSize, cpuSpeed, cpuTemp, bat] =
    await Promise.all([
      si.currentLoad().catch(() => null),
      si.mem().catch(() => null),
      si.osInfo().catch(() => null),
      si.networkStats().catch(() => null),
      si.fsStats().catch(() => null),
      si.fsSize().catch(() => null),
      si.cpuCurrentSpeed().catch(() => null),
      si.cpuTemperature().catch(() => null),
      si.battery().catch(() => null),
    ])

  let tm: Systeminformation.TimeData | null = null
  try {
    tm = si.time()
  } catch {
    /* ignore */
  }

  if (!cachedCpuBrand) {
    const cpu = await si.cpu().catch(() => null)
    cachedCpuBrand = cpu?.brand ?? ''
  }

  return {
    timestamp: Date.now(),
    currentLoad: cl?.currentLoad ?? prev?.currentLoad ?? 0,
    mem: mem ?? prev?.mem ?? emptyMem(),
    osInfo: os ?? prev?.osInfo ?? emptyOs(),
    networkStats: ns ?? prev?.networkStats ?? [],
    fsStats: fs ?? prev?.fsStats ?? emptyFsStats(),
    fsSize: fsSize ?? prev?.fsSize ?? [],
    cpuCurrentSpeed: cpuSpeed ??
      prev?.cpuCurrentSpeed ?? { min: 0, max: 0, avg: 0, cores: [] },
    cpuTemperature: cpuTemp ??
      prev?.cpuTemperature ?? { main: 0, cores: [], max: 0 },
    battery: mapBattery(bat, prev?.battery),
    time: tm ??
      prev?.time ?? { uptime: 0, timezone: '', timezoneName: '', current: 0 },
    cpuBrand: cachedCpuBrand || prev?.cpuBrand || '',
    unavailableMetrics: [],
  }
}

const systemMonitorObj = {
  async getSnapshot(): Promise<SystemSnapshot> {
    try {
      return await collectSnapshot(null)
    } catch (error) {
      console.error('Failed to collect system snapshot:', error)
      throw error
    }
  },
}

contextBridge.exposeInMainWorld('systemMonitor', systemMonitorObj)

declare global {
  const systemMonitor: typeof systemMonitorObj
}
