import defaults from 'licia/defaults'
import contain from 'licia/contain'
import trim from 'licia/trim'
import isUrl from 'licia/isUrl'
import isStrBlank from 'licia/isStrBlank'
import lowerCase from 'licia/lowerCase'
import filter from 'licia/filter'
import splitPath from 'licia/splitPath'
import isArr from 'licia/isArr'
import map from 'licia/map'
import type { ActionType, SlotAction, Slots } from '../types'
import { SLOT_COUNT } from '../types'

const ACTION_TYPES: ActionType[] = [
  'command',
  'plugin',
  'app',
  'directory',
  'url',
]

export function emptySlots(): Slots {
  return Array.from({ length: SLOT_COUNT }, () => null)
}

export function normalizeSlots(raw: unknown): Slots {
  const slots = emptySlots()
  if (!isArr(raw)) return slots
  map(raw.slice(0, SLOT_COUNT), (item, index) => {
    if (!item || typeof item !== 'object') return
    const partial = item as Partial<SlotAction> & { id?: string }
    if (!partial.id) return
    slots[index] = normalizeSlotAction(
      partial as Partial<SlotAction> & { id: string }
    )
  })
  return slots
}

export function normalizeSlotAction(
  raw: Partial<SlotAction> & { id: string }
): SlotAction {
  const action = defaults(
    { ...raw },
    {
      name: '',
      enabled: true,
      type: 'command' as ActionType,
      command: '',
    }
  )
  if (!contain(ACTION_TYPES, action.type)) {
    action.type = 'command'
  }
  return action as SlotAction
}

export function ensureUrl(url: string) {
  const trimmed = trim(url)
  if (isUrl(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function folderName(dirPath: string) {
  return splitPath(dirPath).name || dirPath
}

export function actionUsesIcon(type: ActionType) {
  return type === 'app' || type === 'plugin'
}

export function filterByName<T extends { name: string }>(
  items: T[],
  query: string
) {
  if (isStrBlank(query)) return items
  const q = lowerCase(query)
  return filter(items, (item) => contain(lowerCase(item.name), q))
}

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

export function donutSlicePath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
) {
  const startOuter = polarToCartesian(cx, cy, outerR, endAngle)
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle)
  const startInner = polarToCartesian(cx, cy, innerR, endAngle)
  const endInner = polarToCartesian(cx, cy, innerR, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ')
}

export function slotAngles(index: number) {
  const sweep = 360 / SLOT_COUNT
  const start = index * sweep
  const end = start + sweep
  const mid = start + sweep / 2
  return { start, end, mid }
}
