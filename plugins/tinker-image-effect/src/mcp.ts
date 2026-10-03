import each from 'licia/each'
import isUndef from 'licia/isUndef'
import splitPath from 'licia/splitPath'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import type {
  AsciiParams,
  EffectId,
  PixelateParams,
  SketchParams,
} from './types'
import pkg from '../package.json'

type EffectArgs = {
  path: string
  overwriteOriginal?: boolean
  save?: boolean
  outputPath?: string
} & Partial<SketchParams> &
  Partial<PixelateParams> &
  Partial<AsciiParams>

const SKETCH_KEYS: Array<keyof SketchParams> = [
  'thickness',
  'brightness',
  'detail',
  'deepen',
]
const PIXELATE_KEYS: Array<keyof PixelateParams> = [
  'pixelSize',
  'paletteEnabled',
  'palette',
  'outline',
]
const ASCII_KEYS: Array<keyof AsciiParams> = [
  'cellSize',
  'contrast',
  'invert',
  'charset',
]

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

    const outputDir = splitPath(outputPath).dir
    if (!(await fileExists(outputDir))) {
      throw new Error(`Output directory not found: ${outputDir}`)
    }
  }

  if (effect === 'sketch') {
    each(SKETCH_KEYS, (key) => {
      const value = args[key]
      if (!isUndef(value)) store.setSketchParam(key, value)
    })
  } else if (effect === 'pixelate') {
    each(PIXELATE_KEYS, (key) => {
      const value = args[key]
      if (!isUndef(value)) store.setPixelateParam(key, value)
    })
  } else {
    each(ASCII_KEYS, (key) => {
      const value = args[key]
      if (!isUndef(value)) store.setAsciiParam(key, value)
    })
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
