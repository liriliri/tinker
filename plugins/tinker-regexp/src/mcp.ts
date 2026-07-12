import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    get: (store) => getRegexp(store),
    set: setRegexp,
    get_text: (store) => getTestText(store),
    set_text: setTestText,
  })
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'set': {
      const pattern = (args.pattern as string) || ''
      const flags = args.flags as string | undefined
      return flags ? `/${pattern}/${flags}` : pattern
    }
    case 'set_text':
      return (args.text as string) || ''
    default:
      return ''
  }
}

function getRegexp(store: Store) {
  return {
    pattern: store.pattern,
    flags: store.flags,
    error: store.error,
    matchCount: store.matches.length,
  }
}

function setRegexp(store: Store, args: Record<string, unknown>) {
  store.setPattern(args.pattern as string)
  if (args.flags !== undefined) {
    store.setFlags(args.flags as string)
  }
  return getRegexp(store)
}

function getTestText(store: Store) {
  return store.testText
}

function setTestText(store: Store, args: Record<string, unknown>) {
  const text = args.text as string
  store.setTestText(text)
  return `Test text updated (${text.length} characters).`
}
