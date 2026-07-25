import dateFormat from 'licia/dateFormat'
import isUndef from 'licia/isUndef'
import trim from 'licia/trim'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store, TimestampUnit, Timezone } from './store'
import pkg from '../package.json'

interface OptionsArgs {
  unit?: TimestampUnit
  timezone?: Timezone
}

interface ToTimestampArgs extends OptionsArgs {
  date: string
}

interface ToDateArgs extends OptionsArgs {
  timestamp: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    now,
    to_timestamp: toTimestamp,
    to_date: toDate,
    get: (store) => serialize(store),
  })
}

function formatDate(date: Date) {
  return dateFormat(date, 'yyyy-mm-dd HH:MM:ss')
}

function serialize(store: Store) {
  const fromTimestamp = store.timestampInput
    ? store.timestampToDate(store.timestampInput)
    : null

  return {
    unit: store.timestampUnit,
    timezone: store.timezone,
    now: store.currentTimestampDisplay,
    date: formatDate(store.selectedDate),
    dateTimestamp: store.dateToTimestamp(store.selectedDate),
    timestampInput: store.timestampInput || null,
    timestampDate: fromTimestamp ? formatDate(fromTimestamp) : null,
    timezones: store.timezones,
  }
}

function applyOptions(store: Store, args: OptionsArgs) {
  if (!isUndef(args.unit)) {
    store.setTimestampUnit(args.unit)
  }
  if (!isUndef(args.timezone)) {
    if (!store.timezones.includes(args.timezone)) {
      throw new Error(
        `Unknown timezone "${args.timezone}". Valid: ${store.timezones.join(
          ', '
        )}.`
      )
    }
    store.setTimezone(args.timezone)
  }
}

function now(store: Store, args: OptionsArgs = {}) {
  applyOptions(store, args)
  store.currentTimestamp = Date.now()
  store.setSelectedDate(new Date(store.currentTimestamp))
  store.setTimestampInput(store.currentTimestampDisplay)
  return serialize(store)
}

function toTimestamp(store: Store, args: ToTimestampArgs) {
  applyOptions(store, args)

  const date = new Date(trim(args.date))
  if (isNaN(date.getTime())) {
    throw new Error(
      `Invalid date: ${args.date}. Use ISO or "YYYY-MM-DDTHH:mm:ss".`
    )
  }

  store.setSelectedDate(date)
  const timestamp = store.dateToTimestamp(date)
  store.setTimestampInput(timestamp)

  return {
    date: formatDate(date),
    timestamp,
    unit: store.timestampUnit,
    timezone: store.timezone,
  }
}

function toDate(store: Store, args: ToDateArgs) {
  applyOptions(store, args)

  const timestamp = trim(String(args.timestamp))
  if (!timestamp) {
    throw new Error('timestamp is required.')
  }

  const date = store.timestampToDate(timestamp)
  if (!date) {
    throw new Error(`Invalid timestamp: ${args.timestamp}`)
  }

  store.setTimestampInput(timestamp)
  store.setSelectedDate(date)

  return {
    timestamp,
    date: formatDate(date),
    unit: store.timestampUnit,
    timezone: store.timezone,
  }
}
