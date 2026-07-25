import isUndef from 'licia/isUndef'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { EncodingType, Store } from './store'
import pkg from '../package.json'

interface EncodeArgs {
  text: string
  type?: EncodingType
}

interface DecodeArgs {
  text: string
  type?: EncodingType
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    encode,
    decode,
  })
}

function applyType(store: Store, type?: EncodingType) {
  if (!isUndef(type) && type !== store.encodingType) {
    store.setEncodingType(type)
    store.clearOutput()
  }
}

function encode(store: Store, args: EncodeArgs) {
  applyType(store, args.type)
  store.setInputText(args.text)
  try {
    store.encodeText()
  } catch {
    throw new Error('Encode failed.')
  }
  return {
    type: store.encodingType,
    input: store.inputText,
    output: store.outputText,
  }
}

function decode(store: Store, args: DecodeArgs) {
  applyType(store, args.type)
  store.setInputText(args.text)
  try {
    store.decodeText()
  } catch {
    throw new Error('Decode failed.')
  }
  return {
    type: store.encodingType,
    input: store.inputText,
    output: store.outputText,
  }
}
