import splitPath from 'licia/splitPath'
import {
  createPluginMcpApi,
  formatMcpError,
  type McpJsonValue,
  type McpToolHandlerResult,
  type PluginMcp,
} from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    open_image: openImage,
    get_image: (store) => getImage(store),
    crop_image: cropImage,
    resize_image: resizeImage,
    save_image: saveImage,
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

function requireImage(store: Store): string | null {
  if (!store.image) {
    return 'Error: No image is open. Call open_image first.'
  }
  return null
}

async function openImage(
  store: Store,
  args: Record<string, unknown>
): Promise<McpToolHandlerResult> {
  const path = args.path as string

  if (!(await fileExists(path))) {
    return `Error: Image file not found: ${path}`
  }

  try {
    const buffer = await tinker.readFile(path)
    const fileName = splitPath(path).name
    const file = new File([buffer], fileName, { type: 'image/*' })
    await store.loadImage(file, path)
    return serializeImage(store)
  } catch (error) {
    return formatMcpError(error, 'Failed to open image')
  }
}

function getImage(store: Store): McpToolHandlerResult {
  return serializeImage(store)
}

async function loadImageElement(imageUrl: string) {
  const img = new Image()
  img.src = imageUrl

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
  })

  return img
}

async function exportCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result)
      } else {
        reject(new Error('Failed to export image'))
      }
    })
  })

  return {
    blob,
    dataUrl: canvas.toDataURL(),
    width,
    height,
  }
}

async function cropImageOnCanvas(
  imageUrl: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const img = await loadImageElement(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }

  ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
  return exportCanvas(canvas, width, height)
}

async function resizeImageOnCanvas(
  imageUrl: string,
  width: number,
  height: number
) {
  const img = await loadImageElement(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }

  ctx.drawImage(img, 0, 0, width, height)
  return exportCanvas(canvas, width, height)
}

function applyCanvasResult(
  store: Store,
  result: { blob: Blob; dataUrl: string; width: number; height: number }
) {
  store.setCroppedImage(
    result.blob,
    result.dataUrl,
    result.width,
    result.height
  )
  store.applyCroppedImage()
  store.setCropBoxSize(result.width, result.height)
}

async function cropImage(
  store: Store,
  args: Record<string, unknown>
): Promise<McpToolHandlerResult> {
  const imageError = requireImage(store)
  if (imageError) return imageError

  const x = args.x as number
  const y = args.y as number
  const width = args.width as number
  const height = args.height as number
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
    return `Error: Crop region must be within image bounds (${imageWidth}x${imageHeight}).`
  }

  try {
    const cropped = await cropImageOnCanvas(
      store.image!.originalUrl,
      x,
      y,
      width,
      height
    )

    applyCanvasResult(store, cropped)

    return {
      crop: { x, y, width, height },
      ...serializeImage(store),
    }
  } catch (error) {
    return formatMcpError(error, 'Failed to crop image')
  }
}

async function resizeImage(
  store: Store,
  args: Record<string, unknown>
): Promise<McpToolHandlerResult> {
  const imageError = requireImage(store)
  if (imageError) return imageError

  let width = args.width as number | undefined
  let height = args.height as number | undefined
  const keepAspectRatio = (args.keepAspectRatio as boolean | undefined) ?? false
  const aspectRatio =
    store.originalAspectRatio ?? store.image!.width / store.image!.height

  if (keepAspectRatio) {
    if (width !== undefined && height === undefined) {
      height = Math.round(width / aspectRatio)
    } else if (height !== undefined && width === undefined) {
      width = Math.round(height * aspectRatio)
    }
  }

  if (
    width === undefined ||
    height === undefined ||
    width <= 0 ||
    height <= 0
  ) {
    return 'Error: width and height are required. With keepAspectRatio true, provide either width or height.'
  }

  try {
    const resized = await resizeImageOnCanvas(
      store.image!.originalUrl,
      width,
      height
    )

    applyCanvasResult(store, resized)

    return {
      resize: { width, height, keepAspectRatio },
      ...serializeImage(store),
    }
  } catch (error) {
    return formatMcpError(error, 'Failed to resize image')
  }
}

async function saveImage(
  store: Store,
  args: Record<string, unknown>
): Promise<McpToolHandlerResult> {
  const imageError = requireImage(store)
  if (imageError) return imageError

  if (store.historyIndex <= 0) {
    return 'Error: No image edits to save.'
  }

  const overwriteOriginal =
    (args.overwriteOriginal as boolean | undefined) ?? store.overwriteOriginal
  const outputPath = args.outputPath as string | undefined

  if (!overwriteOriginal) {
    if (!outputPath) {
      return 'Error: outputPath is required when overwriteOriginal is false.'
    }

    if (!(await fileExists(splitPath(outputPath).dir))) {
      return `Error: Output directory not found: ${splitPath(outputPath).dir}`
    }
  }

  try {
    store.setOverwriteOriginal(overwriteOriginal)
    const savedPath = (await store.saveImage(outputPath)) ?? null

    return {
      savedPath,
      ...serializeImage(store),
    }
  } catch (error) {
    return formatMcpError(error, 'Failed to save image')
  }
}
