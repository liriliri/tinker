declare const _tinker: {
  runFFmpeg(args: string[]): { promise: Promise<void>; taskId: string }
}

const JPEG_QV_MIN = 2
const JPEG_QV_MAX = 31

function jpegQualityToQv(quality: number): string {
  const qv = 2 + Math.round((100 - quality) * 0.29)
  return String(Math.max(JPEG_QV_MIN, Math.min(JPEG_QV_MAX, qv)))
}

export function buildJpegScaleArgs(
  sourcePath: string,
  outputPath: string,
  maxWidth: number,
  jpegQuality: number
): string[] {
  return [
    '-i',
    sourcePath,
    '-vf',
    `scale='min(${maxWidth},iw)':-2`,
    '-frames:v',
    '1',
    '-q:v',
    jpegQualityToQv(jpegQuality),
    '-pix_fmt',
    'yuvj420p',
    '-y',
    outputPath,
  ]
}

export async function runFfmpeg(args: string[]): Promise<void> {
  const { promise } = _tinker.runFFmpeg(args)
  await promise
}
