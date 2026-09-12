import splitPath from 'licia/splitPath'
import isUndef from 'licia/isUndef'
import {
  createPluginMcpApi,
  type McpJsonValue,
  type PluginMcp,
} from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import pkg from '../package.json'
import { cropImageOnCanvas, resizeImageOnCanvas } from './lib/util'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    open: openImage,
    get: (store) => getImage(store),
    crop: cropImage,
    resize: resizeImage,
    save: saveImage,
  })
}

function serializeImage(store: Store): Record<string, McpJsonValue> {
  if (!store.image) {
    return {
      hasImage: false,
      overwriteOriginal: store.overwriteOriginal,
      canUndo: store.canUndo,
      canRedo: store.canRedo,
      isSaved: store.isSaved,
    }
  }

  return {
    hasImage: true,
    overwriteOriginal: store.overwriteOriginal,
    canUndo: store.canUndo,
    canRedo: store.canRedo,
    isSaved: store.isSaved,
    image: {
      fileName: store.image.fileName,
      filePath: store.image.filePath ?? null,
      width: store.image.width,
      height: store.image.height,
      size: store.image.originalSize,
      aspectRatio: store.originalAspectRatio,
    },
    cropBox:
      store.cropBoxWidth > 0 && store.cropBoxHeight > 0
        ? {
            width: store.cropBoxWidth,
            height: store.cropBoxHeight,
          }
        : null,
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
  return serializeImage(store)
}

function getImage(store: Store) {
  return serializeImage(store)
}

async function cropImage(
  store: Store,
  args: { x: number; y: number; width: number; height: number }
) {
  requireImage(store)

  const { x, y, width, height } = args
  const imageWidth = store.image!.width
  const imageHeight = store.image!.height

  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0 ||
    x + width > imageWidth ||
    y + height > imageHeight
  ) {
    throw new Error(
      `Crop region must be within image bounds (${imageWidth}x${imageHeight}).`
    )
  }

  const cropped = await cropImageOnCanvas(
    store.image!.originalUrl,
    x,
    y,
    width,
    height
  )

  store.applyCanvasResult(cropped)

  return {
    crop: { x, y, width, height },
    ...serializeImage(store),
  }
}

async function resizeImage(
  store: Store,
  args: { width?: number; height?: number; keepAspectRatio?: boolean }
) {
  requireImage(store)

  let width = args.width
  let height = args.height
  const keepAspectRatio = args.keepAspectRatio ?? false
  const aspectRatio =
    store.originalAspectRatio ?? store.image!.width / store.image!.height

  if (keepAspectRatio) {
    if (!isUndef(width) && isUndef(height)) {
      height = Math.round(width / aspectRatio)
    } else if (!isUndef(height) && isUndef(width)) {
      width = Math.round(height * aspectRatio)
    }
  }

  if (isUndef(width) || isUndef(height) || width <= 0 || height <= 0) {
    throw new Error(
      'width and height are required. With keepAspectRatio true, provide either width or height.'
    )
  }

  const resized = await resizeImageOnCanvas(
    store.image!.originalUrl,
    width,
    height
  )

  store.applyCanvasResult(resized)

  return {
    resize: { width, height, keepAspectRatio },
    ...serializeImage(store),
  }
}

async function saveImage(
  store: Store,
  args: { overwriteOriginal?: boolean; outputPath?: string }
) {
  requireImage(store)

  if (store.historyIndex <= 0) {
    throw new Error('No image edits to save.')
  }

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
    ...serializeImage(store),
  }
}
