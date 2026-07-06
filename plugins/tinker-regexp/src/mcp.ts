import {
  getMcpToolsFromPackage,
  mcpToolsToOpenAiDefinitions,
  registerPluginMcp,
  type PluginMcp,
} from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  const toolDefinitions = mcpToolsToOpenAiDefinitions(
    getMcpToolsFromPackage(pkg)
  )

  return registerPluginMcp({
    callTool: (name, args) => executeTool(getStore(), name, args),
    createAgentTools: () =>
      toolDefinitions.map((definition) => ({
        definition,
        execute: (args) =>
          executeTool(getStore(), definition.function.name, args),
      })),
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
      return summary.length > 60 ? `${summary.slice(0, 60)}…` : summary
    }
    case 'set_test_text': {
      const text = typeof args.text === 'string' ? args.text : ''
      return text.length > 60 ? `${text.slice(0, 60)}…` : text
    }
    default:
      return ''
  }
}

function executeTool(
  store: Store,
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'get_regexp':
      return getRegexp(store)
    case 'set_regexp':
      return setRegexp(store, args)
    case 'get_test_text':
      return getTestText(store)
    case 'set_test_text':
      return setTestText(store, args)
    default:
      return `Error: Unknown tool "${name}"`
  }
}

function getRegexp(store: Store): string {
  return JSON.stringify(
    {
      pattern: store.pattern,
      flags: store.flags,
      error: store.error,
      matchCount: store.matches.length,
    },
    null,
    2
  )
}

function setRegexp(store: Store, args: Record<string, unknown>): string {
  const pattern = typeof args.pattern === 'string' ? args.pattern : ''
  store.setPattern(pattern)
  if (typeof args.flags === 'string') {
    store.setFlags(args.flags)
  }
  return getRegexp(store)
}

function getTestText(store: Store): string {
  return store.testText
}

function setTestText(store: Store, args: Record<string, unknown>): string {
  const text = typeof args.text === 'string' ? args.text : ''
  store.setTestText(text)
  return `Test text updated (${text.length} characters).`
}
