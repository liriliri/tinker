import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import { isMediaFileName } from './lib/util'
import { clampSegmentTimes, isZeroLengthSegment } from './lib/segments'
import pkg from '../package.json'

interface OpenArgs {
  path: string
}

interface SegmentRangeArgs {
  start: number
  end: number
}

interface SetSegmentsArgs {
  segments: SegmentRangeArgs[]
}

interface ExportArgs {
  outputDirectory?: string
  keyframeCut?: boolean
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    open: openMedia,
    get: serializeState,
    set_segments: setSegments,
    export: exportSegments,
  })
}

function requireMedia(store: Store) {
  if (!store.media) {
    throw new Error('No media is open. Call open first.')
  }
}

function serializeState(store: Store) {
  if (!store.media) {
    return {
      hasMedia: false,
      media: null,
      segments: [],
      keyframeCut: store.keyframeCut,
      outputDir: store.outputDir,
      exportableCount: 0,
      isExporting: store.isExporting,
      progress: store.progress,
    }
  }

  return {
    hasMedia: true,
    media: {
      fileName: store.media.fileName,
      filePath: store.media.filePath,
      duration: store.media.duration,
      size: store.media.size,
      hasVideo: store.media.hasVideo,
      hasAudio: store.media.hasAudio,
      width: store.media.width,
      height: store.media.height,
    },
    segments: store.segments.map((seg) => ({
      id: seg.id,
      start: seg.start,
      end: seg.end,
      duration: Math.max(0, seg.end - seg.start),
    })),
    keyframeCut: store.keyframeCut,
    outputDir: store.outputDir,
    exportableCount: store.exportableCount,
    isExporting: store.isExporting,
    progress: store.progress,
  }
}

async function openMedia(store: Store, args: OpenArgs) {
  if (store.isExporting) {
    throw new Error('Cannot open media while exporting.')
  }
  if (!(await fileExists(args.path))) {
    throw new Error(`Media file not found: ${args.path}`)
  }
  if (!isMediaFileName(args.path)) {
    throw new Error('Only audio and video files are supported.')
  }

  await store.loadMedia(args.path)
  return serializeState(store)
}

function setSegments(store: Store, args: SetSegmentsArgs) {
  requireMedia(store)
  if (store.isExporting) {
    throw new Error('Cannot edit segments while exporting.')
  }

  const duration = store.duration
  const ranges = args.segments.map((seg, index) => {
    const next = clampSegmentTimes(seg.start, seg.end, duration)
    if (isZeroLengthSegment(next.start, next.end)) {
      throw new Error(
        `Segment at index ${index} has zero length after clamping to media duration (${duration}s).`
      )
    }
    return next
  })

  store.replaceSegments(ranges)
  return serializeState(store)
}

async function exportSegments(store: Store, args: ExportArgs) {
  requireMedia(store)
  if (store.isExporting) {
    throw new Error('Export already in progress.')
  }

  if (args.keyframeCut !== undefined) {
    store.setKeyframeCut(args.keyframeCut)
  }

  if (args.outputDirectory !== undefined) {
    if (
      args.outputDirectory !== '' &&
      !(await fileExists(args.outputDirectory))
    ) {
      throw new Error(`Output directory not found: ${args.outputDirectory}`)
    }
    store.setOutputDir(args.outputDirectory)
  }

  try {
    const outputs = await store.exportSegments()
    return {
      outputs: outputs ?? [],
      ...serializeState(store),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message === 'NO_SEGMENTS') {
      throw new Error('No exportable segments. Call set_segments first.')
    }
    if (message === 'CANCELLED') {
      throw new Error('Export was cancelled.')
    }
    throw err
  }
}
