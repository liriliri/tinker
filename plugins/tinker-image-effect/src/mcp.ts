import splitPath from 'licia/splitPath'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import type {
  AsciiCharset,
  EffectId,
  PixelPaletteId,
  SketchParams,
} from './types'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    apply_sketch: applySketch,
    apply_pixelate: applyPixelate,
    apply_ascii: applyAscii,
  })
}

async function applySketch(store: Store, args: Record<string, unknown>) {
  applySketchParams(store, args)
  return applyEffect(store, 'sketch', args)
}

async function applyPixelate(store: Store, args: Record<string, unknown>) {
  applyPixelateParams(store, args)
  return applyEffect(store, 'pixelate', args)
}

async function applyAscii(store: Store, args: Record<string, unknown>) {
  applyAsciiParams(store, args)
  return applyEffect(store, 'ascii', args)
}

async function applyEffect(
  store: Store,
  effect: EffectId,
  args: Record<string, unknown>
) {
  const path = args.path as string
  const overwriteOriginal =
    (args.overwriteOriginal as boolean | undefined) ?? store.overwriteOriginal
  const save = (args.save as boolean | undefined) ?? true
  const outputPath = args.outputPath as string | undefined

  if (!(await fileExists(path))) {
    throw new Error(`Image file not found: ${path}`)
  }

  if (save && !overwriteOriginal) {
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
  store.setEffect(effect)

  const buffer = await tinker.readFile(path)
  const fileName = splitPath(path).name
  const file = new File([buffer], fileName, { type: 'image/*' })
  await store.loadImage(file, path)

  let savedPath: string | null = null
  if (save) {
    savedPath = (await store.saveImage(outputPath)) ?? null
  }

  return {
    effect: store.effectId,
    params: store.params[store.effectId],
    overwriteOriginal: store.overwriteOriginal,
    isSaved: store.isSaved,
    savedPath,
    image: store.image
      ? {
          fileName: store.image.fileName,
          filePath: store.image.filePath ?? null,
          width: store.image.width,
          height: store.image.height,
        }
      : null,
  }
}

function applySketchParams(store: Store, args: Record<string, unknown>) {
  const keys: Array<keyof SketchParams> = [
    'thickness',
    'brightness',
    'detail',
    'deepen',
  ]
  for (const key of keys) {
    if (args[key] !== undefined) {
      store.setSketchParam(key, args[key] as SketchParams[typeof key])
    }
  }
}

function applyPixelateParams(store: Store, args: Record<string, unknown>) {
  if (args.pixelSize !== undefined) {
    store.setPixelateParam('pixelSize', args.pixelSize as number)
  }
  if (args.paletteEnabled !== undefined) {
    store.setPixelateParam('paletteEnabled', args.paletteEnabled as boolean)
  }
  if (args.palette !== undefined) {
    store.setPixelateParam('palette', args.palette as PixelPaletteId)
  }
  if (args.outline !== undefined) {
    store.setPixelateParam('outline', args.outline as boolean)
  }
}

function applyAsciiParams(store: Store, args: Record<string, unknown>) {
  if (args.cellSize !== undefined) {
    store.setAsciiParam('cellSize', args.cellSize as number)
  }
  if (args.contrast !== undefined) {
    store.setAsciiParam('contrast', args.contrast as number)
  }
  if (args.invert !== undefined) {
    store.setAsciiParam('invert', args.invert as boolean)
  }
  if (args.charset !== undefined) {
    store.setAsciiParam('charset', args.charset as AsciiCharset)
  }
}
