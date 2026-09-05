import { joinPath } from 'share/lib/util'

/**
 * Extract a lightweight mono WAV for WaveSurfer background rendering.
 * Keeps decode cost low for long video/audio files.
 */
export async function prepareWaveformFile(filePath: string): Promise<string> {
  const tmpDir = await tinker.getPath('temp')
  const out = joinPath(tmpDir, `tinker-media-splitter-wave-${Date.now()}.wav`)
  await tinker.runFFmpeg([
    '-i',
    filePath,
    '-vn',
    '-ac',
    '1',
    '-ar',
    '8000',
    '-y',
    out,
  ])
  return out
}

export function fitWaveSurferWidth(ws: {
  getWidth: () => number
  getDuration: () => number
  zoom: (minPxPerSec: number) => void
}) {
  const duration = ws.getDuration()
  const width = ws.getWidth()
  if (!(duration > 0) || !(width > 0)) return
  ws.zoom(width / duration)
}
