import isUndef from 'licia/isUndef'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Languages } from './lib/formatter/types'
import type { Store } from './store'
import pkg from '../package.json'

interface FormatArgs {
  code: string
  language?: Languages
  tabWidth?: number
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    format,
  })
}

async function format(store: Store, args: FormatArgs) {
  if (!isUndef(args.language)) {
    store.setLanguage(args.language)
  }
  if (!isUndef(args.tabWidth)) {
    store.setTabWidth(args.tabWidth)
  }

  await store.formatCode(args.code)

  return {
    language: store.language,
    tabWidth: store.tabWidth,
    code: store.input,
  }
}
