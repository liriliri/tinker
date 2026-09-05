import clamp from 'licia/clamp'
import filter from 'licia/filter'
import map from 'licia/map'
import uuid from 'licia/uuid'
import type { Segment, SegmentToExport } from '../types'

const EPS = 1e-4
export const DEFAULT_SEGMENT_DURATION = 5

export function createSegment(
  partial: Partial<Segment> & { start: number; end: number }
): Segment {
  return {
    id: partial.id || uuid(),
    start: partial.start,
    end: partial.end,
  }
}

export function isSegmentFinished(seg: Segment): boolean {
  return seg.end - seg.start > EPS
}

export function getExportableSegments(segments: Segment[]): SegmentToExport[] {
  return map(filter(segments, isSegmentFinished), (seg, index) => ({
    id: seg.id,
    start: seg.start,
    end: seg.end,
    index,
  }))
}

export function clampSegmentTimes(
  start: number,
  end: number,
  duration: number
): { start: number; end: number } {
  const safeDuration = Math.max(0, duration)
  const nextStart = clamp(start, 0, safeDuration)
  const nextEnd = clamp(end, 0, safeDuration)
  if (nextEnd < nextStart) {
    return { start: nextEnd, end: nextStart }
  }
  return { start: nextStart, end: nextEnd }
}

export function segmentDuration(seg: Segment): number {
  return Math.max(0, seg.end - seg.start)
}

export function isZeroLengthSegment(start: number, end: number): boolean {
  return Math.abs(end - start) <= EPS
}

export function canSplitSegmentAt(seg: Segment, time: number): boolean {
  return time - seg.start > EPS && seg.end - time > EPS
}

export function defaultSegmentEnd(start: number, duration: number): number {
  return clamp(start + DEFAULT_SEGMENT_DURATION, 0, duration)
}

/** Split [0, duration] into `count` equal ranges. */
export function buildEqualSegments(
  duration: number,
  count: number
): { start: number; end: number }[] {
  const n = Math.floor(count)
  if (!(duration > 0) || n < 2) return []

  const ranges: { start: number; end: number }[] = []
  for (let i = 0; i < n; i++) {
    ranges.push({
      start: (duration * i) / n,
      end: (duration * (i + 1)) / n,
    })
  }
  ranges[n - 1].end = duration
  return ranges
}

export function estimateSegmentBytes(
  segDuration: number,
  fileDuration: number,
  fileSize: number
): number {
  if (fileDuration <= 0 || segDuration <= 0) return 0
  return Math.round((segDuration / fileDuration) * fileSize)
}
