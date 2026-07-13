import { contextBridge } from 'electron'
import si from 'systeminformation'
import type { Systeminformation } from 'systeminformation'
import type { SystemSnapshot } from '../common/types'

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

async function collectSnapshot(): Promise<SystemSnapshot> {
  const [cl, mem, os, ns, fs, fsSize, bat] = await Promise.all([
    si.currentLoad().catch(() => null),
    si.mem().catch(() => null),
    si.osInfo().catch(() => null),
    si.networkStats().catch(() => null),
    si.fsStats().catch(() => null),
    si.fsSize().catch(() => null),
    si.battery().catch(() => null),
  ])

  let uptime = 0
  try {
    uptime = si.time()?.uptime ?? 0
  } catch {
    /* ignore */
  }

  return {
    timestamp: Date.now(),
    currentLoad: cl?.currentLoad ?? 0,
    mem: mem ?? emptyMem(),
    osInfo: os ?? emptyOs(),
    networkStats: ns ?? [],
    fsStats: fs ?? emptyFsStats(),
    fsSize: fsSize ?? [],
    battery: {
      hasBattery: bat?.hasBattery ?? false,
      percent: bat?.hasBattery ? bat.percent ?? 0 : 0,
    },
    uptime,
  }
}

const api = {
  async getSnapshot(): Promise<SystemSnapshot> {
    try {
      return await collectSnapshot()
    } catch (error) {
      console.error('Failed to collect system snapshot:', error)
      throw error
    }
  },
}

contextBridge.exposeInMainWorld('systemMonitor', api)

declare global {
  const systemMonitor: typeof api
}
