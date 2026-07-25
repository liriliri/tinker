import isUndef from 'licia/isUndef'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { calculate, config, getType, getUnit } from './lib/units'
import type { Store } from './store'
import pkg from '../package.json'

const TYPE_KEYS = config.map((item) => item.key)

interface ConvertArgs {
  value: string
  type?: string
  from?: string
  to?: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    list,
    convert,
    get: (store) => serialize(store),
  })
}

function list() {
  return {
    types: config.map((item) => ({
      key: item.key,
      main: item.main,
      units: item.unit.map((unit) => ({
        key: unit.key,
        unit: unit.unit,
      })),
    })),
  }
}

function serialize(store: Store) {
  return {
    type: store.type,
    from: store.from,
    value: store.input,
    results: store.allResults.map((result) => ({
      key: result.key,
      value: result.value,
      unit: result.unit,
    })),
  }
}

function convert(store: Store, args: ConvertArgs) {
  const type = args.type ?? store.type
  try {
    getType(type)
  } catch {
    throw new Error(
      `Unknown type "${type}". Valid: ${TYPE_KEYS.join(
        ', '
      )}. Call list for units.`
    )
  }

  if (!isUndef(args.type) && args.type !== store.type) {
    store.setType(type)
  }

  const from = args.from ?? store.from
  try {
    getUnit(type, from)
  } catch {
    throw new Error(
      `Unknown from unit "${from}" for type "${type}". Call list for valid units.`
    )
  }

  if (from !== store.from) {
    store.setFrom(from)
  }

  const value = String(args.value)
  store.setInput(value)

  if (!isUndef(args.to)) {
    let toUnit
    try {
      toUnit = getUnit(type, args.to)
    } catch {
      throw new Error(
        `Unknown to unit "${args.to}" for type "${type}". Call list for valid units.`
      )
    }

    return {
      type,
      from,
      to: args.to,
      value,
      result: calculate(type, value, from, args.to),
      unit: toUnit.unit,
    }
  }

  return serialize(store)
}
