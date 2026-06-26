import compact from 'licia/compact'
import map from 'licia/map'
import ms from 'licia/ms'
import range from 'licia/range'
import sortBy from 'licia/sortBy'
import trim from 'licia/trim'
import type { Anniversary, SidebarItem } from '../types'
import { normalizeDateKey } from './date'
import { LUNAR_DAYS, LUNAR_MONTHS, lunarToSolarDateKey } from './lunar'
import {
  getHolidayTemplates,
  getHolidayDateForYear,
  type HolidayTemplate,
} from 'share/lib/holidays'

export function toAnniversary(
  id: string,
  data: Omit<Anniversary, 'id'>
): Anniversary {
  return {
    id,
    title: trim(data.title),
    isLunar: data.isLunar,
    month: data.month,
    day: data.day,
    lunarMonth: data.lunarMonth,
    lunarDay: data.lunarDay,
    startYear: data.startYear,
  }
}

export function getAnniversaryDateForYear(
  anniversary: Anniversary,
  year: number
): string | null {
  if (anniversary.isLunar) {
    if (!anniversary.lunarMonth || !anniversary.lunarDay) return null
    return lunarToSolarDateKey(
      year,
      anniversary.lunarMonth,
      anniversary.lunarDay
    )
  }

  if (!anniversary.month || !anniversary.day) return null
  return getSolarDateForYear(anniversary.month, anniversary.day, year)
}

function getSolarDateForYear(
  month: number,
  day: number,
  year: number
): string | null {
  const date = new Date(year, month - 1, day)
  if (date.getMonth() === month - 1 && date.getDate() === day) {
    return normalizeDateKey(date)
  }

  if (month === 2 && day === 29) {
    return normalizeDateKey(new Date(year, 1, 28))
  }

  return null
}

function getDaysBetween(from: Date, to: Date): number {
  const fromMidnight = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate()
  )
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((toMidnight.getTime() - fromMidnight.getTime()) / ms('1d'))
}

export function getNextOccurrenceDate(
  getDateForYear: (year: number) => string | null,
  fromDate: Date = new Date()
): string | null {
  const todayKey = normalizeDateKey(fromDate)
  const year = fromDate.getFullYear()

  for (const y of range(year, year + 2)) {
    const dateKey = getDateForYear(y)
    if (dateKey && dateKey >= todayKey) {
      return dateKey
    }
  }

  return getDateForYear(year + 2)
}

export function getDaysUntilNext(
  getDateForYear: (year: number) => string | null,
  fromDate: Date = new Date()
): number {
  const nextDate = getNextOccurrenceDate(getDateForYear, fromDate)
  if (!nextDate) return 0

  return getDaysBetween(fromDate, new Date(`${nextDate}T00:00:00`))
}

export function getAnniversaryDatesInRange(
  anniversary: Anniversary,
  startKey: string,
  endKey: string
): Array<{ id: string; date: string; title: string }> {
  const startYear = parseInt(startKey.slice(0, 4), 10)
  const endYear = parseInt(endKey.slice(0, 4), 10)

  return compact(
    map(range(startYear, endYear + 1), (year) => {
      const dateKey = getAnniversaryDateForYear(anniversary, year)
      if (!dateKey || dateKey < startKey || dateKey > endKey) return null

      return {
        id: `${anniversary.id}-${year}`,
        date: dateKey,
        title: anniversary.title,
      }
    })
  )
}

export function getDaysSinceStart(
  anniversary: Anniversary,
  fromDate: Date = new Date()
): number | undefined {
  if (!anniversary.startYear) return undefined

  const startDateKey = getAnniversaryDateForYear(
    anniversary,
    anniversary.startYear
  )
  if (!startDateKey) return undefined

  const days = getDaysBetween(new Date(`${startDateKey}T00:00:00`), fromDate)
  return days >= 0 ? days : undefined
}

function buildSidebarItem(
  id: string,
  title: string,
  getDateForYear: (year: number) => string | null,
  fromDate: Date,
  options: {
    isHoliday: boolean
    isLunar: boolean
    anniversaryId?: string
    daysSince?: number
  }
): SidebarItem | null {
  const nextDate = getNextOccurrenceDate(getDateForYear, fromDate)
  if (!nextDate) return null

  return {
    id,
    title,
    daysUntil: getDaysUntilNext(getDateForYear, fromDate),
    daysSince: options.daysSince,
    nextDate,
    isHoliday: options.isHoliday,
    isLunar: options.isLunar,
    anniversaryId: options.anniversaryId,
  }
}

function buildAnniversarySidebarItem(
  anniversary: Anniversary,
  fromDate: Date
): SidebarItem | null {
  return buildSidebarItem(
    `anniversary-${anniversary.id}`,
    anniversary.title,
    (year) => getAnniversaryDateForYear(anniversary, year),
    fromDate,
    {
      isHoliday: false,
      isLunar: anniversary.isLunar,
      anniversaryId: anniversary.id,
      daysSince: getDaysSinceStart(anniversary, fromDate),
    }
  )
}

function buildHolidaySidebarItem(
  holiday: HolidayTemplate,
  fromDate: Date
): SidebarItem | null {
  return buildSidebarItem(
    `holiday-${holiday.id}`,
    holiday.nameKey,
    (year) => getHolidayDateForYear(holiday, year),
    fromDate,
    {
      isHoliday: true,
      isLunar: !!holiday.isLunar,
    }
  )
}

export function getSidebarItems(
  anniversaries: Anniversary[],
  showHolidays: boolean,
  locale: string,
  fromDate: Date = new Date()
): SidebarItem[] {
  const anniversaryItems = compact(
    map(anniversaries, (anniversary) =>
      buildAnniversarySidebarItem(anniversary, fromDate)
    )
  )
  const holidayItems = showHolidays
    ? compact(
        map(getHolidayTemplates(locale), (holiday) =>
          buildHolidaySidebarItem(holiday, fromDate)
        )
      )
    : []

  return sortBy(
    [...anniversaryItems, ...holidayItems],
    (item) => item.daysUntil
  )
}

export function formatLunarDateLabel(month: number, day: number): string {
  return `${LUNAR_MONTHS[month - 1]}${LUNAR_DAYS[day - 1]}`
}

export function formatAnniversaryDateLabel(
  anniversary: Anniversary,
  nextDate: string,
  monthFormatter: Intl.DateTimeFormat,
  yearFormatter: Intl.DateTimeFormat,
  formatStartYearLunar: (year: number, lunarLabel: string) => string
): string {
  if (anniversary.startYear) {
    const startDateKey = getAnniversaryDateForYear(
      anniversary,
      anniversary.startYear
    )
    if (startDateKey) {
      if (
        anniversary.isLunar &&
        anniversary.lunarMonth &&
        anniversary.lunarDay
      ) {
        return formatStartYearLunar(
          anniversary.startYear,
          formatLunarDateLabel(anniversary.lunarMonth, anniversary.lunarDay)
        )
      }
      return yearFormatter.format(new Date(`${startDateKey}T00:00:00`))
    }
  }

  if (anniversary.isLunar && anniversary.lunarMonth && anniversary.lunarDay) {
    return formatLunarDateLabel(anniversary.lunarMonth, anniversary.lunarDay)
  }

  return monthFormatter.format(new Date(`${nextDate}T00:00:00`))
}
