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

type EffectArgs = {
  path: string
  overwriteOriginal?: boolean
  save?: boolean
  outputPath?: string
  thickness?: number
  brightness?: number
  detail?: number
  deepen?: number
  pixelSize?: number
  paletteEnabled?: boolean
  palette?: PixelPaletteId
  outline?: boolean
  cellSize?: number
  contrast?: number
  invert?: boolean
  charset?: AsciiCharset
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    apply_sketch: (store, args) => applyEffect(store, 'sketch', args),
    apply_pixelate: (store, args) => applyEffect(store, 'pixelate', args),
    apply_ascii: (store, args) => applyEffect(store, 'ascii', args),
  })
}

async function applyEffect(store: Store, effect: EffectId, args: EffectArgs) {
  const overwriteOriginal = args.overwriteOriginal ?? store.overwriteOriginal
  const save = args.save ?? true
  const { path, outputPath } = args

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

  if (effect === 'sketch') {
    applySketchParams(store, args)
  } else if (effect === 'pixelate') {
    applyPixelateParams(store, args)
  } else {
    applyAsciiParams(store, args)
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

function applySketchParams(store: Store, args: EffectArgs) {
  const keys: Array<keyof SketchParams> = [
    'thickness',
    'brightness',
    'detail',
    'deepen',
  ]
  for (const key of keys) {
    const value = args[key]
    if (value !== undefined) {
      store.setSketchParam(key, value)
    }
  }
}

function applyPixelateParams(store: Store, args: EffectArgs) {
  if (args.pixelSize !== undefined) {
    store.setPixelateParam('pixelSize', args.pixelSize)
  }
  if (args.paletteEnabled !== undefined) {
    store.setPixelateParam('paletteEnabled', args.paletteEnabled)
  }
  if (args.palette !== undefined) {
    store.setPixelateParam('palette', args.palette)
  }
  if (args.outline !== undefined) {
    store.setPixelateParam('outline', args.outline)
  }
}

function applyAsciiParams(store: Store, args: EffectArgs) {
  if (args.cellSize !== undefined) {
    store.setAsciiParam('cellSize', args.cellSize)
  }
  if (args.contrast !== undefined) {
    store.setAsciiParam('contrast', args.contrast)
  }
  if (args.invert !== undefined) {
    store.setAsciiParam('invert', args.invert)
  }
  if (args.charset !== undefined) {
    store.setAsciiParam('charset', args.charset)
  }
}
