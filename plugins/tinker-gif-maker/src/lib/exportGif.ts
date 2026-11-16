import isEmpty from 'licia/isEmpty'
import lpad from 'licia/lpad'
import map from 'licia/map'
import normalizePath from 'licia/normalizePath'
import { joinPath } from 'share/lib/util'
import type { GifFrame } from '../types'

function toFfmpegPath(filePath: string) {
  return normalizePath(filePath).replace(/'/g, "'\\''")
}

async function readFrameBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to read frame data')
  }
  return new Uint8Array(await response.arrayBuffer())
}

export async function exportGif(frames: GifFrame[], outputPath: string) {
  if (isEmpty(frames)) {
    throw new Error('No frames to export')
  }

  const tempDir = await tinker.getPath('temp')
  const stamp = Date.now()
  const prefix = joinPath(tempDir, `tinker-gif-maker-${stamp}`)
  const listPath = `${prefix}-list.txt`
  const tempFiles = [listPath]

  try {
    const lines = ['ffconcat version 1.0']
    let lastFramePath = ''

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      const framePath = `${prefix}-${lpad(String(i), 4, '0')}.png`
      tempFiles.push(framePath)
      await tinker.writeFile(framePath, await readFrameBytes(frame.url))

      const duration = Math.max(0.01, frame.delay / 1000)
      const escaped = toFfmpegPath(framePath)
      lines.push(`file '${escaped}'`)
      lines.push(`duration ${duration}`)
      lastFramePath = escaped
    }

    // concat demuxer needs the last file listed again without duration
    lines.push(`file '${lastFramePath}'`)
    await tinker.writeFile(listPath, lines.join('\n'))

    await tinker.runFFmpeg([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-vf',
      'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
      '-loop',
      '0',
      '-y',
      outputPath,
    ])
  } finally {
    await Promise.all(
      map(tempFiles, (filePath) => tinker.rm(filePath).catch(() => undefined))
    )
  }
}
