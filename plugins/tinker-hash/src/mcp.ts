import isUndef from 'licia/isUndef'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import pkg from '../package.json'

interface HashArgs {
  text?: string
  path?: string
  uppercase?: boolean
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    hash,
  })
}

async function hash(store: Store, args: HashArgs) {
  const hasText = !isUndef(args.text)
  const hasPath = !isUndef(args.path)

  if (hasText === hasPath) {
    throw new Error('Provide exactly one of text or path.')
  }

  if (!isUndef(args.uppercase)) {
    store.setUppercase(args.uppercase)
  }

  if (hasPath) {
    const path = args.path!
    if (!(await fileExists(path))) {
      throw new Error(`File not found: ${path}`)
    }

    store.setInputType('file')
    await store.handleFilePath(path)

    return {
      inputType: 'file' as const,
      path,
      fileName: store.fileName,
      uppercase: store.uppercase,
      hashes: store.hashResults,
    }
  }

  store.setInputType('text')
  store.setInput(args.text!)

  return {
    inputType: 'text' as const,
    input: store.input,
    uppercase: store.uppercase,
    hashes: store.hashResults,
  }
}
