let gpuEncoder: string | null = null
let gpuEncoderChecked = false

export async function detectGpuEncoder(): Promise<string | null> {
  if (gpuEncoderChecked) return gpuEncoder

  const candidates = ['h264_videotoolbox', 'h264_nvenc', 'h264_qsv', 'h264_amf']
  for (const encoder of candidates) {
    try {
      await (tinker.runFFmpeg([
        '-f',
        'lavfi',
        '-i',
        'color=black:s=64x64:d=0.1',
        '-t',
        '0.1',
        '-c:v',
        encoder,
        '-an',
        '-f',
        'null',
        '/dev/null',
      ]) as unknown as Promise<void>)
      gpuEncoder = encoder
      break
    } catch {
      // Encoder not available, try next
    }
  }

  gpuEncoderChecked = true
  return gpuEncoder
}
