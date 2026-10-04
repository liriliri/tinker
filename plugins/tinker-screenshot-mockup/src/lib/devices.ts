import type { DeviceMeta } from '../types'
import find from 'licia/find'

const devices: DeviceMeta[] = [
  { id: 'phone', width: 428, height: 868 },
  { id: 'tablet', width: 560, height: 778 },
  { id: 'pc', width: 740, height: 434 },
]

export function getDevice(id: string): DeviceMeta | undefined {
  return find(devices, (d) => d.id === id)
}
