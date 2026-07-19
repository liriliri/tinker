import average from 'licia/average'
import contain from 'licia/contain'
import filter from 'licia/filter'
import isEmpty from 'licia/isEmpty'
import isUndef from 'licia/isUndef'
import map from 'licia/map'
import pluck from 'licia/pluck'
import some from 'licia/some'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import {
  AUDIO_OUTPUT_FORMATS,
  IMAGE_OUTPUT_FORMATS,
  VIDEO_OUTPUT_FORMATS,
} from './lib/constants'
import { resolveMediaMode } from './lib/mediaType'
import type { Store } from './store'
import type { MediaItem, MediaType } from './types'
import pkg from '../package.json'

interface ConvertArgs {
  paths: string[]
  mode?: MediaType
  format?: string
  outputDirectory?: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    convert,
    get_status: getStatus,
    cancel,
  })
}

async function convert(store: Store, args: ConvertArgs) {
  if (store.isConverting) {
    throw new Error(
      'Conversion already in progress. Call get_status to poll, or cancel first.'
    )
  }

  const { paths } = args
  for (const filePath of paths) {
    if (!(await fileExists(filePath))) {
      throw new Error(`Media file not found: ${filePath}`)
    }
  }

  const mode = resolveMediaMode(paths)
  if (!isUndef(args.mode) && args.mode !== mode) {
    throw new Error(
      `File type is ${mode}, but mode is ${args.mode}. Omit mode to auto-detect.`
    )
  }

  if (!isUndef(args.format)) {
    assertFormatForMode(mode, args.format)
  }

  if (!isUndef(args.outputDirectory)) {
    if (args.outputDirectory) {
      if (!(await fileExists(args.outputDirectory))) {
        throw new Error(`Output directory not found: ${args.outputDirectory}`)
      }
      store.setOutputDir(args.outputDirectory)
    } else {
      store.setOutputDir('')
    }
  }

  store.setMode(mode)
  store.clear()
  for (const filePath of paths) {
    await store.loadMedia(filePath)
  }

  if (!isUndef(args.format)) {
    store.setOutputFormat(args.format)
  }

  if (isEmpty(store.items)) {
    throw new Error('No convertible media files were loaded.')
  }

  if (!store.hasUnconverted) {
    store.clear()
    throw new Error(
      'All files already match the target format; nothing to convert.'
    )
  }

  void store.convertAll()

  return {
    started: true,
    message: 'Conversion started. Call get_status to poll progress until done.',
    ...serializeStatus(store),
  }
}

function getStatus(store: Store) {
  return serializeStatus(store)
}

function cancel(store: Store) {
  if (!store.isConverting) {
    throw new Error('No conversion is in progress.')
  }
  store.cancelConversion()
  return {
    cancelled: true,
    ...serializeStatus(store),
  }
}

function serializeStatus(store: Store) {
  const items = store.items
  const serialized = map(items, serializeItem)
  const doneCount = filter(items, (item) => item.isDone).length
  const errorCount = filter(items, (item) => Boolean(item.error)).length
  const totalProgress = isEmpty(items)
    ? 0
    : Math.round(average(...map(items, (item) => item.progress)))
  const isComplete =
    !store.isConverting &&
    !isEmpty(items) &&
    (doneCount > 0 || errorCount > 0) &&
    !some(
      items,
      (item) => !item.isDone && item.error === null && store.isConvertible(item)
    )

  return {
    isConverting: store.isConverting,
    isComplete,
    mode: store.mode,
    outputFormat: store.outputFormat,
    outputDir: store.outputDir || null,
    total: items.length,
    doneCount,
    errorCount,
    totalProgress,
    items: serialized,
  }
}

function serializeItem(item: MediaItem) {
  return {
    fileName: item.fileName,
    filePath: item.filePath,
    progress: item.progress,
    isConverting: item.isConverting,
    isDone: item.isDone,
    outputPath: item.outputPath,
    error: item.error,
    originalSize: item.originalSize,
    outputSize: item.outputSize,
  }
}

function assertFormatForMode(mode: MediaType, format: string) {
  const valid =
    mode === 'video'
      ? pluck(VIDEO_OUTPUT_FORMATS, 'value')
      : mode === 'audio'
      ? AUDIO_OUTPUT_FORMATS
      : IMAGE_OUTPUT_FORMATS

  if (!contain(valid, format)) {
    throw new Error(
      `Invalid ${mode} format "${format}". Valid: ${valid.join(', ')}.`
    )
  }
}
