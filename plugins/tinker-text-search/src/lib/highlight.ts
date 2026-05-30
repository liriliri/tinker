import clamp from 'licia/clamp'
import rtrim from 'licia/rtrim'
import sortBy from 'licia/sortBy'
import type { Segment } from '../types'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * Split a line of text into segments using ripgrep submatches.
 * `start`/`end` are UTF-8 byte offsets within the line; we encode the line
 * to bytes, slice on byte boundaries, then decode back so multi-byte chars
 * (e.g. CJK) are not chopped.
 */
export function buildSegments(
  line: string,
  submatches: tinker.SearchTextSubmatch[]
): Segment[] {
  const text = rtrim(line, ['\n', '\r'])
  if (!submatches || submatches.length === 0) {
    return [{ text, matched: false }]
  }

  const sorted = sortBy(submatches, (sm) => sm.start)
  const bytes = encoder.encode(text)
  const segments: Segment[] = []
  let cursor = 0

  for (const sm of sorted) {
    const start = clamp(sm.start, 0, bytes.length)
    const end = clamp(sm.end, start, bytes.length)
    if (start > cursor) {
      segments.push({
        text: decoder.decode(bytes.slice(cursor, start)),
        matched: false,
      })
    }
    if (end > start) {
      segments.push({
        text: decoder.decode(bytes.slice(start, end)),
        matched: true,
      })
    }
    cursor = end
  }

  if (cursor < bytes.length) {
    segments.push({
      text: decoder.decode(bytes.slice(cursor)),
      matched: false,
    })
  }

  return segments
}

/**
 * Convert a (lineText, byteStart, byteEnd) triple to UTF-16 column offsets
 * (1-based, suitable for monaco-editor).
 */
export function byteRangeToColumns(
  lineText: string,
  byteStart: number,
  byteEnd: number
): { startColumn: number; endColumn: number } {
  const text = rtrim(lineText, ['\n', '\r'])
  const bytes = encoder.encode(text)
  const start = clamp(byteStart, 0, bytes.length)
  const end = clamp(byteEnd, start, bytes.length)

  const before = decoder.decode(bytes.slice(0, start))
  const matched = decoder.decode(bytes.slice(start, end))

  const startColumn = before.length + 1
  const endColumn = startColumn + matched.length
  return { startColumn, endColumn }
}

/**
 * Extract a single 1-based line from a multi-line string.
 */
export function getLineText(content: string, lineNumber: number): string {
  if (!content || lineNumber < 1) return ''
  let start = 0
  for (let i = 1; i < lineNumber; i++) {
    const idx = content.indexOf('\n', start)
    if (idx === -1) return ''
    start = idx + 1
  }
  const end = content.indexOf('\n', start)
  return end === -1 ? content.slice(start) : content.slice(start, end)
}
