import splitPath from 'licia/splitPath'
import {
  createPluginMcpApi,
  type McpJsonValue,
  type PluginMcp,
} from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import pkg from '../package.json'

interface OpenVideoArgs {
  path: string
}

interface CropVideoArgs {
  x: number
  y: number
  width: number
  height: number
  outputPath: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    open: openVideo,
    get: serializeVideo,
    crop: cropVideo,
  })
}

function serializeVideo(store: Store): Record<string, McpJsonValue> {
  if (!store.video) {
    return {
      hasVideo: false,
    }
  }

  return {
    hasVideo: true,
    video: {
      fileName: store.video.fileName,
      filePath: store.video.filePath,
      width: store.video.width,
      height: store.video.height,
      duration: store.video.duration,
      size: store.video.size,
      aspectRatio: store.originalAspectRatio,
    },
    crop: {
      x: store.cropX,
      y: store.cropY,
      width: store.cropBoxWidth,
      height: store.cropBoxHeight,
    },
  }
}

function requireVideo(store: Store) {
  if (!store.video) {
    throw new Error('No video is open. Call open first.')
  }
}

async function openVideo(store: Store, args: OpenVideoArgs) {
  if (store.isExporting) {
    throw new Error('Cannot open a video while exporting.')
  }

  if (!(await fileExists(args.path))) {
    throw new Error(`Video file not found: ${args.path}`)
  }

  await store.loadVideo(args.path)
  return serializeVideo(store)
}

async function cropVideo(store: Store, args: CropVideoArgs) {
  requireVideo(store)

  if (store.isExporting) {
    throw new Error('Export already in progress.')
  }

  const { x, y, width, height, outputPath } = args
  const videoWidth = store.video!.width
  const videoHeight = store.video!.height

  if (x + width > videoWidth || y + height > videoHeight) {
    throw new Error(
      `Crop region must be within video bounds (${videoWidth}x${videoHeight}).`
    )
  }

  const outputDir = splitPath(outputPath).dir
  if (!(await fileExists(outputDir))) {
    throw new Error(`Output directory not found: ${outputDir}`)
  }

  store.setCropRegion({ x, y, width, height })

  const savedPath = await store.exportVideo(outputPath)
  if (!savedPath) {
    throw new Error('Failed to export video.')
  }

  return {
    savedPath,
    ...serializeVideo(store),
  }
}
