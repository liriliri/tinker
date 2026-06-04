/** Hard limit (~70 MB). Diffs above this cannot be rendered. */
export const MAX_DIFF_BUFFER_SIZE = 70_000_000

/**
 * Suggested limit (~4.375 MB). Diffs at or above this are hidden by default
 */
export const MAX_REASONABLE_DIFF_SIZE = MAX_DIFF_BUFFER_SIZE / 16

/** Skip rendering when any single diff line exceeds this length. */
export const MAX_CHARACTERS_PER_LINE = 5000

export function getUtf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

export function isDiffTextUnrenderable(diff: string): boolean {
  return getUtf8ByteLength(diff) > MAX_DIFF_BUFFER_SIZE
}

export function isDiffBlockTooLarge(body: string, rawLines: string[]): boolean {
  if (getUtf8ByteLength(body) >= MAX_REASONABLE_DIFF_SIZE) {
    return true
  }

  for (const line of rawLines) {
    if (line.length > MAX_CHARACTERS_PER_LINE) {
      return true
    }
  }

  return false
}
