import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { getSidebarItems } from './lib/anniversary'
import type { Anniversary } from './types'
import type { Store } from './store'
import pkg from '../package.json'

type AnniversaryArgs = {
  id?: string
  title?: string
  isLunar?: boolean
  month?: number
  day?: number
  lunarMonth?: number
  lunarDay?: number
  startYear?: number | null
}

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

function requireAnniversary(store: Store, id: string): Anniversary {
  const anniversary = store.getAnniversaryById(id)
  if (!anniversary) {
    throw new Error(`Anniversary with id "${id}" not found.`)
  }
  return anniversary
}

function parseAnniversaryData(
  args: AnniversaryArgs,
  existing?: Anniversary
): Omit<Anniversary, 'id'> {
  const title =
    args.title !== undefined ? args.title.trim() : existing?.title ?? ''
  if (!title) {
    throw new Error('title is required and cannot be empty.')
  }

  const isLunar = args.isLunar ?? existing?.isLunar ?? false

  if (isLunar) {
    const lunarMonth = args.lunarMonth ?? existing?.lunarMonth
    const lunarDay = args.lunarDay ?? existing?.lunarDay

    if (!lunarMonth || !lunarDay) {
      throw new Error(
        'lunarMonth and lunarDay are required for lunar anniversaries.'
      )
    }

    return {
      title,
      isLunar: true,
      lunarMonth,
      lunarDay,
      startYear: parseStartYear(args, existing),
    }
  }

  const month = args.month ?? existing?.month
  const day = args.day ?? existing?.day

  if (!month || !day) {
    throw new Error('month and day are required for solar anniversaries.')
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
  args: AnniversaryArgs,
  existing?: Anniversary
): number | undefined {
  if (args.startYear === null) return undefined
  if (args.startYear !== undefined) {
    return Number.isNaN(args.startYear) ? undefined : args.startYear
  }
  return existing?.startYear
}

function addAnniversary(store: Store, args: AnniversaryArgs) {
  const data = parseAnniversaryData(args)
  store.addAnniversary(data)
  return getAnniversaries(store)
}

function updateAnniversary(
  store: Store,
  args: AnniversaryArgs & { id: string }
) {
  const existing = requireAnniversary(store, args.id)
  const data = parseAnniversaryData(args, existing)
  store.updateAnniversary(args.id, data)
  return getAnniversaries(store)
}

function deleteAnniversary(store: Store, args: { id: string }) {
  requireAnniversary(store, args.id)
  store.removeAnniversary(args.id)
  return getAnniversaries(store)
}
