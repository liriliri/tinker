import lpad from 'licia/lpad'
import splitPath from 'licia/splitPath'
import { joinPath, resolveSavePath } from 'share/lib/util'
import { formatFilenameTime, trimTrailingSlash } from './util'
import type { SegmentToExport } from '../types'

function formatFfmpegNumber(n: number) {
  return n.toFixed(6)
}

interface BuildCutArgsOptions {
  input: string
  output: string
  cutFrom: number
  cutTo: number
  fileDuration: number
  /** When true, seek with -ss before -i (fast, keyframe-aligned). */
  keyframeCut: boolean
}

/**
 * Lossless stream-copy cut, modeled after lossless-cut's losslessCutSingle.
 * Uses -t duration (not -to). Places -ss before -i for keyframe cuts.
 */
export function buildLosslessCutArgs(options: BuildCutArgsOptions): string[] {
  const { input, output, cutFrom, cutTo, fileDuration, keyframeCut } = options
  const cuttingStart = cutFrom > 1e-5
  const cuttingEnd = cutTo < fileDuration - 1e-5
  const cutDuration = Math.max(cutTo - cutFrom, 0)

  const cutFromArgs = cuttingStart ? ['-ss', formatFfmpegNumber(cutFrom)] : []
  const cutToArgs = cuttingEnd ? ['-t', formatFfmpegNumber(cutDuration)] : []

  const args = ['-y', '-hide_banner']

  if (keyframeCut) {
    args.push(...cutFromArgs, '-i', input, ...cutToArgs)
    if (cuttingStart) {
      args.push('-avoid_negative_ts', 'make_zero')
    }
  } else {
    args.push('-i', input, ...cutFromArgs, ...cutToArgs)
  }

  args.push('-map', '0', '-c', 'copy', '-ignore_unknown', output)
  return args
}

function buildSegmentOutputName(
  sourcePath: string,
  segment: SegmentToExport,
  totalCount: number
): string {
  const { name, ext } = splitPath(sourcePath)
  const base = name.slice(0, name.length - ext.length)
  const from = formatFilenameTime(segment.start)
  const to = formatFilenameTime(segment.end)
  const suffix =
    totalCount > 1 ? `-seg${lpad(String(segment.index + 1), 2, '0')}` : ''
  return `${base}-${from}-${to}${suffix}${ext}`
}

export async function resolveSegmentOutputPath(
  sourcePath: string,
  outputDir: string,
  segment: SegmentToExport,
  totalCount: number
): Promise<string> {
  const fileName = buildSegmentOutputName(sourcePath, segment, totalCount)
  return resolveSavePath(joinPath(trimTrailingSlash(outputDir), fileName))
}
