import find from 'licia/find'
import map from 'licia/map'
import splitPath from 'licia/splitPath'
import {
  createPluginMcpApi,
  type McpJsonValue,
  type PluginMcp,
} from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import { PHOTO_FILTERS } from './lib/filters'
import type { Store } from './store'
import type { Adjustments, ScalarAdjustmentKey } from './types'
import type { MixerChannel } from './types/hsl'
import pkg from '../package.json'

const FILTER_IDS = map(PHOTO_FILTERS, (filter) => filter.id)

const SCALAR_KEYS: ScalarAdjustmentKey[] = [
  'exposure',
  'brightness',
  'contrast',
  'highlights',
  'shadows',
  'whites',
  'blacks',
  'temperature',
  'tint',
  'vibrance',
  'saturation',
  'sharpness',
  'sharpnessThreshold',
  'lumaNoiseReduction',
  'colorNoiseReduction',
  'vignetteAmount',
  'vignetteMidpoint',
  'vignetteRoundness',
  'vignetteFeather',
  'grainAmount',
  'grainSize',
  'grainRoughness',
]

type AdjustArgs = Partial<Pick<Adjustments, ScalarAdjustmentKey>> & {
  hsl?: Partial<Record<MixerChannel, Partial<Adjustments['hsl'][MixerChannel]>>>
  curves?: Partial<Adjustments['curves']>
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    open: openImage,
    get: (store) => serializeState(store),
    adjust: adjustImage,
    apply_filter: applyFilter,
    reset: resetImage,
    save: saveImage,
  })
}

function serializeState(store: Store): Record<string, McpJsonValue> {
  if (!store.image) {
    return {
      hasImage: false,
      overwriteOriginal: store.overwriteOriginal,
      canUndo: store.canUndo,
      canRedo: store.canRedo,
      isSaved: store.isSaved,
      hasAdjustments: store.hasAdjustments,
      activeFilterId: store.activeFilterId,
      filters: FILTER_IDS,
    }
  }

  return {
    hasImage: true,
    overwriteOriginal: store.overwriteOriginal,
    canUndo: store.canUndo,
    canRedo: store.canRedo,
    isSaved: store.isSaved,
    hasAdjustments: store.hasAdjustments,
    activeFilterId: store.activeFilterId,
    filters: FILTER_IDS,
    image: {
      fileName: store.image.fileName,
      filePath: store.image.filePath ?? null,
      width: store.image.width,
      height: store.image.height,
    },
    adjustments: store.adjustments as unknown as McpJsonValue,
  }
}

function requireImage(store: Store) {
  if (!store.image) {
    throw new Error('No image is open. Call open first.')
  }
}

async function openImage(store: Store, args: { path: string }) {
  if (!(await fileExists(args.path))) {
    throw new Error(`Image file not found: ${args.path}`)
  }

  const buffer = await tinker.readFile(args.path)
  const fileName = splitPath(args.path).name
  const file = new File([buffer], fileName, { type: 'image/*' })
  await store.loadImage(file, args.path)
  return serializeState(store)
}

function adjustImage(store: Store, args: AdjustArgs) {
  requireImage(store)

  const patch: Partial<Adjustments> = {}
  let hasPatch = false

  for (const key of SCALAR_KEYS) {
    const value = args[key]
    if (value !== undefined) {
      patch[key] = value
      hasPatch = true
    }
  }

  if (args.hsl) {
    patch.hsl = store.adjustments.hsl
    for (const channel of Object.keys(args.hsl) as MixerChannel[]) {
      const channelPatch = args.hsl[channel]
      if (!channelPatch) continue
      patch.hsl = {
        ...patch.hsl,
        [channel]: {
          ...patch.hsl![channel],
          ...channelPatch,
        },
      }
    }
    hasPatch = true
  }

  if (args.curves) {
    patch.curves = {
      ...store.adjustments.curves,
      ...args.curves,
    }
    hasPatch = true
  }

  if (!hasPatch) {
    throw new Error('Provide at least one adjustment field to update.')
  }

  store.patchAdjustments(patch)
  return serializeState(store)
}

function applyFilter(store: Store, args: { filterId: string }) {
  requireImage(store)

  if (!find(FILTER_IDS, (id) => id === args.filterId)) {
    throw new Error(
      `Unknown filter "${args.filterId}". Available: ${FILTER_IDS.join(', ')}`
    )
  }

  store.applyFilter(args.filterId)
  return serializeState(store)
}

function resetImage(store: Store) {
  requireImage(store)
  store.resetAdjustments()
  return serializeState(store)
}

async function saveImage(
  store: Store,
  args: { overwriteOriginal?: boolean; outputPath?: string }
) {
  requireImage(store)

  const overwriteOriginal = args.overwriteOriginal ?? store.overwriteOriginal
  const { outputPath } = args

  if (!overwriteOriginal) {
    if (!outputPath) {
      throw new Error('outputPath is required when overwriteOriginal is false.')
    }

    if (!(await fileExists(splitPath(outputPath).dir))) {
      throw new Error(
        `Output directory not found: ${splitPath(outputPath).dir}`
      )
    }
  }

  store.setOverwriteOriginal(overwriteOriginal)
  const savedPath = (await store.saveImage(outputPath)) ?? null

  return {
    savedPath,
    ...serializeState(store),
  }
}
