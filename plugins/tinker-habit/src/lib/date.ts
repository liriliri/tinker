import dateFormat from 'licia/dateFormat'
import toDate from 'licia/toDate'
import toInt from 'licia/toInt'

const DATE_KEY_MASK = 'yyyy-mm-dd'

export function normalizeDateKey(value: string | Date): string {
  return value instanceof Date
    ? dateFormat(value, DATE_KEY_MASK)
    : value.slice(0, 10)
}

export function todayKey(): string {
  return normalizeDateKey(new Date())
}

export function parseDateKey(dateKey: string): Date {
  return toDate(`${dateKey}T00:00:00`)
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return normalizeDateKey(date)
}

export function getWeekday(dateKey: string): number {
  return parseDateKey(dateKey).getDay()
}

/** Monday-start week: [monday, sunday] */
export function getWeekRange(dateKey: string): { start: string; end: string } {
  const day = getWeekday(dateKey)
  const mondayOffset = day === 0 ? -6 : 1 - day
  const start = addDays(dateKey, mondayOffset)
  return { start, end: addDays(start, 6) }
}

export function getMonthRange(
  year: number,
  month: number
): { start: string; end: string } {
  const start = normalizeDateKey(new Date(year, month - 1, 1))
  const end = normalizeDateKey(new Date(year, month, 0))
  return { start, end }
}

export function getMonthParts(dateKey: string): {
  year: number
  month: number
} {
  return {
    year: toInt(dateKey.slice(0, 4)),
    month: toInt(dateKey.slice(5, 7)),
  }
}

export function compareDateKeys(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export function eachDate(
  start: string,
  end: string,
  fn: (dateKey: string) => void
) {
  let cursor = start
  while (compareDateKeys(cursor, end) <= 0) {
    fn(cursor)
    cursor = addDays(cursor, 1)
  }
}

export function minDateKey(a: string, b: string): string {
  return compareDateKeys(a, b) <= 0 ? a : b
}

export function maxDateKey(a: string, b: string): string {
  return compareDateKeys(a, b) >= 0 ? a : b
}
