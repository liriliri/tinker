export interface LyricLine {
  time: number
  text: string
}

/**
 * Parse LRC format lyrics into structured lines.
 * Supports [mm:ss.xx] and [mm:ss.xxx] time tags.
 */
export function parseLrc(lrcText: string): LyricLine[] {
  const lines: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2})([.:]\d{2,3})?\]/g

  for (const line of lrcText.split('\n')) {
    const times: number[] = []
    let match: RegExpExecArray | null

    while ((match = timeRegex.exec(line)) !== null) {
      const min = parseInt(match[1], 10)
      const sec = parseInt(match[2], 10)
      let ms = 0
      if (match[3]) {
        const raw = match[3].slice(1)
        ms = raw.length === 3 ? parseInt(raw, 10) : parseInt(raw, 10) * 10
      }
      times.push(min * 60 + sec + ms / 1000)
    }

    if (times.length === 0) continue

    const text = line.replace(/\[\d{2}:\d{2}([.:]\d{2,3})?\]/g, '').trim()
    for (const time of times) {
      lines.push({ time, text })
    }
  }

  lines.sort((a, b) => a.time - b.time)
  return lines
}

/**
 * Find the current lyric line index based on playback time.
 */
export function findCurrentLine(
  lines: LyricLine[],
  currentTime: number
): number {
  if (lines.length === 0) return -1

  for (let i = lines.length - 1; i >= 0; i--) {
    if (currentTime >= lines[i].time) {
      return i
    }
  }
  return -1
}

/**
 * Try to load an LRC file that sits alongside the audio file.
 * e.g., /path/to/song.mp3 -> /path/to/song.lrc
 */
export async function loadLrcForPath(
  audioPath: string
): Promise<string | null> {
  const lrcPath = audioPath.replace(/\.[^.]+$/, '.lrc')
  try {
    const content = await tinker.readFile(lrcPath, 'utf-8')
    return content || null
  } catch {
    return null
  }
}
