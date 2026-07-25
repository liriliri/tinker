import isStrBlank from 'licia/isStrBlank'
import map from 'licia/map'
import trim from 'licia/trim'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'

interface CalculateArgs {
  expression: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    calculate,
    get: (store) => getPad(store),
    clear: (store) => clearPad(store),
  })
}

function serializeLines(store: Store) {
  return map(
    store.lines.filter((line) => !isStrBlank(line.expression)),
    (line) => ({
      expression: line.expression,
      result: line.result || null,
    })
  )
}

function getPad(store: Store) {
  return {
    isEmpty: store.isEmpty,
    lines: serializeLines(store),
  }
}

function clearPad(store: Store) {
  store.clear()
  return getPad(store)
}

function calculate(store: Store, args: CalculateArgs) {
  const expressions = args.expression
    .split('\n')
    .map((line) => trim(line))
    .filter((line) => !isStrBlank(line))

  if (expressions.length === 0) {
    throw new Error('expression is required and cannot be empty.')
  }

  store.clear()

  for (const expression of expressions) {
    const line = store.lines[store.lines.length - 1]
    store.updateExpression(line.id, expression)
  }

  return getPad(store)
}
