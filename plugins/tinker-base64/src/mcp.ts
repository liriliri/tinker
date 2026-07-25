import isUndef from 'licia/isUndef'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import pkg from '../package.json'

interface EncodeArgs {
  text?: string
  path?: string
  asDataUrl?: boolean
}

interface DecodeArgs {
  text: string
  path?: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    encode,
    decode,
  })
}

async function encode(store: Store, args: EncodeArgs) {
  const hasText = !isUndef(args.text)
  const hasPath = !isUndef(args.path)

  if (hasText === hasPath) {
    throw new Error('Provide exactly one of text or path.')
  }

  if (!isUndef(args.asDataUrl)) {
    store.setOutputAsDataUrl(args.asDataUrl)
  }

  if (hasPath) {
    const path = args.path!
    if (!(await fileExists(path))) {
      throw new Error(`File not found: ${path}`)
    }

    store.setInputType('file')
    await store.handleFilePath(path)

    if (!store.fileBase64) {
      throw new Error('Failed to encode file.')
    }

    return {
      inputType: 'file' as const,
      path,
      fileName: store.fileName,
      asDataUrl: store.outputAsDataUrl,
      output: store.fileBase64,
    }
  }

  store.setInputType('text')
  store.setInputText(args.text!)
  store.encodeText()

  return {
    inputType: 'text' as const,
    input: store.inputText,
    output: store.outputText,
  }
}

async function decode(store: Store, args: DecodeArgs) {
  store.setInputType('text')
  store.setInputText(args.text)

  if (!isUndef(args.path)) {
    const savedPath = await store.decodeToFile(args.path)
    if (!savedPath) {
      throw new Error('Decode failed.')
    }
    return {
      path: savedPath,
      input: store.inputText,
    }
  }

  store.decodeText()

  return {
    input: store.inputText,
    output: store.outputText,
  }
}
