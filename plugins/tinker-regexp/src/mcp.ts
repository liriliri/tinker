import {
  createPluginMcpApi,
  truncateMcpArg,
  type McpToolHandlerResult,
  type PluginMcp,
} from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    get_regexp: (store) => getRegexp(store),
    set_regexp: setRegexp,
    get_test_text: (store) => getTestText(store),
    set_test_text: setTestText,
  })
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'set_regexp': {
      const pattern = typeof args.pattern === 'string' ? args.pattern : ''
      const flags = typeof args.flags === 'string' ? args.flags : ''
      const summary = flags ? `/${pattern}/${flags}` : pattern
      return truncateMcpArg(summary)
    }
    case 'set_test_text': {
      const text = typeof args.text === 'string' ? args.text : ''
      return truncateMcpArg(text)
    }
    default:
      return ''
  }
}

function getRegexp(store: Store): McpToolHandlerResult {
  return {
    pattern: store.pattern,
    flags: store.flags,
    error: store.error,
    matchCount: store.matches.length,
  }
}

function setRegexp(
  store: Store,
  args: Record<string, unknown>
): McpToolHandlerResult {
  store.setPattern(args.pattern as string)
  if (args.flags !== undefined) {
    store.setFlags(args.flags as string)
  }
  return getRegexp(store)
}

function getTestText(store: Store): McpToolHandlerResult {
  return store.testText
}

function setTestText(
  store: Store,
  args: Record<string, unknown>
): McpToolHandlerResult {
  const text = args.text as string
  store.setTestText(text)
  return `Test text updated (${text.length} characters).`
}
