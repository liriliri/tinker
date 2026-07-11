import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { getSidebarItems } from './lib/anniversary'
import type { Anniversary } from './types'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    list: (store) => getAnniversaries(store),
    add: addAnniversary,
    update: updateAnniversary,
    delete: deleteAnniversary,
  })
}

function serializeAnniversary(
  anniversary: Anniversary,
  sidebarById: Map<
    string,
    { nextDate: string; daysUntil: number; daysSince?: number }
  >
) {
  const sidebarItem = sidebarById.get(anniversary.id)

  return {
    id: anniversary.id,
    title: anniversary.title,
    isLunar: anniversary.isLunar,
    month: anniversary.month ?? null,
    day: anniversary.day ?? null,
    lunarMonth: anniversary.lunarMonth ?? null,
    lunarDay: anniversary.lunarDay ?? null,
    startYear: anniversary.startYear ?? null,
    nextDate: sidebarItem?.nextDate ?? null,
    daysUntil: sidebarItem?.daysUntil ?? null,
    daysSince: sidebarItem?.daysSince ?? null,
  }
}

function getAnniversaries(store: Store) {
  const sidebarById = new Map(
    getSidebarItems(store.anniversaries, false, 'en-US')
      .filter((item) => item.anniversaryId)
      .map((item) => [
        item.anniversaryId!,
        {
          nextDate: item.nextDate,
          daysUntil: item.daysUntil,
          daysSince: item.daysSince,
        },
      ])
  )

  return {
    selectedDate: store.selectedDate,
    showHolidays: store.showHolidays,
    anniversaries: store.anniversaries.map((anniversary) =>
      serializeAnniversary(anniversary, sidebarById)
    ),
  }
}

function requireAnniversary(store: Store, id: string) {
  const anniversary = store.getAnniversaryById(id)
  if (!anniversary) {
    return `Error: Anniversary with id "${id}" not found.`
  }
  return anniversary
}

function parseAnniversaryData(
  args: Record<string, unknown>,
  existing?: Anniversary
): Omit<Anniversary, 'id'> | string {
  const title =
    args.title !== undefined ? String(args.title).trim() : existing?.title ?? ''
  if (!title) {
    return 'Error: title is required and cannot be empty.'
  }

  const isLunar =
    args.isLunar !== undefined
      ? Boolean(args.isLunar)
      : existing?.isLunar ?? false

  if (isLunar) {
    const lunarMonth =
      args.lunarMonth !== undefined
        ? Number(args.lunarMonth)
        : existing?.lunarMonth
    const lunarDay =
      args.lunarDay !== undefined ? Number(args.lunarDay) : existing?.lunarDay

    if (!lunarMonth || !lunarDay) {
      return 'Error: lunarMonth and lunarDay are required for lunar anniversaries.'
    }

    return {
      title,
      isLunar: true,
      lunarMonth,
      lunarDay,
      startYear: parseStartYear(args, existing),
    }
  }

  const month = args.month !== undefined ? Number(args.month) : existing?.month
  const day = args.day !== undefined ? Number(args.day) : existing?.day

  if (!month || !day) {
    return 'Error: month and day are required for solar anniversaries.'
  }

  return {
    title,
    isLunar: false,
    month,
    day,
    startYear: parseStartYear(args, existing),
  }
}

function parseStartYear(
  args: Record<string, unknown>,
  existing?: Anniversary
): number | undefined {
  if (args.startYear === null) return undefined
  if (args.startYear !== undefined) {
    const year = Number(args.startYear)
    return Number.isNaN(year) ? undefined : year
  }
  return existing?.startYear
}

function addAnniversary(store: Store, args: Record<string, unknown>) {
  const data = parseAnniversaryData(args)
  if (typeof data === 'string') return data

  store.addAnniversary(data)
  return getAnniversaries(store)
}

function updateAnniversary(store: Store, args: Record<string, unknown>) {
  const id = args.id as string
  const existing = requireAnniversary(store, id)
  if (typeof existing === 'string') return existing

  const data = parseAnniversaryData(args, existing)
  if (typeof data === 'string') return data

  store.updateAnniversary(id, data)
  return getAnniversaries(store)
}

function deleteAnniversary(store: Store, args: Record<string, unknown>) {
  const id = args.id as string
  const existing = requireAnniversary(store, id)
  if (typeof existing === 'string') return existing

  store.removeAnniversary(id)
  return getAnniversaries(store)
}
