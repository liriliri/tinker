import dateFormat from 'licia/dateFormat'

const DATE_KEY_MASK = 'yyyy-mm-dd'

export function normalizeDateKey(value: string | Date): string {
  return value instanceof Date
    ? dateFormat(value, DATE_KEY_MASK)
    : value.slice(0, 10)
}

export function getDatePart(dateTimeStr: string): string {
  return dateTimeStr.slice(0, 10)
}

export function getTimePart(dateTimeStr: string): string {
  return dateTimeStr.slice(11, 16)
}

export function createDateTime(dateKey: string, time: string): string {
  return `${dateKey}T${time}`
}
