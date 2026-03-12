import lpad from 'licia/lpad'

let _audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === 'closed') _audioCtx = new AudioContext()
  return _audioCtx
}

function secToSample(buffer: AudioBuffer, sec: number): number {
  return Math.round(sec * buffer.sampleRate)
}

function newBuffer(src: AudioBuffer, length: number): AudioBuffer {
  return getAudioCtx().createBuffer(
    src.numberOfChannels,
    length,
    src.sampleRate
  )
}

export function trimBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const s = secToSample(buffer, start)
  const e = secToSample(buffer, end)
  const result = newBuffer(buffer, e - s)
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    result.getChannelData(i).set(buffer.getChannelData(i).subarray(s, e))
  }
  return result
}

export function deleteBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const s = secToSample(buffer, start)
  const e = secToSample(buffer, end)
  const result = newBuffer(buffer, buffer.length - (e - s))
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src.subarray(0, s))
    dst.set(src.subarray(e), s)
  }
  return result
}

export function silenceBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const s = secToSample(buffer, start)
  const e = secToSample(buffer, end)
  const result = newBuffer(buffer, buffer.length)
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const dst = result.getChannelData(i)
    dst.set(buffer.getChannelData(i))
    dst.fill(0, s, e)
  }
  return result
}

export function gainBuffer(buffer: AudioBuffer, factor: number): AudioBuffer {
  const result = newBuffer(buffer, buffer.length)
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    for (let j = 0; j < src.length; j++) dst[j] = src[j] * factor
  }
  return result
}

export function normalizeBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const s = secToSample(buffer, start)
  const e = secToSample(buffer, end)
  let peak = 0
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const data = buffer.getChannelData(i)
    for (let j = s; j < e; j++) {
      const abs = Math.abs(data[j])
      if (abs > peak) peak = abs
    }
  }
  if (peak === 0) return buffer
  const factor = 1 / peak
  const result = newBuffer(buffer, buffer.length)
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src)
    for (let j = s; j < e; j++) dst[j] = src[j] * factor
  }
  return result
}

export function copyBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  return trimBuffer(buffer, start, end)
}

export function pasteBuffer(
  buffer: AudioBuffer,
  clip: AudioBuffer,
  offset: number
): AudioBuffer {
  const o = secToSample(buffer, offset)
  const result = newBuffer(buffer, buffer.length + clip.length)
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src.subarray(0, o))
    if (i < clip.numberOfChannels) dst.set(clip.getChannelData(i), o)
    dst.set(src.subarray(o), o + clip.length)
  }
  return result
}

export function fadeInBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const s = secToSample(buffer, start)
  const e = secToSample(buffer, end)
  const len = e - s
  const result = newBuffer(buffer, buffer.length)
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src)
    for (let j = s; j < e; j++) dst[j] = src[j] * ((j - s) / len)
  }
  return result
}

export function fadeOutBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const s = secToSample(buffer, start)
  const e = secToSample(buffer, end)
  const len = e - s
  const result = newBuffer(buffer, buffer.length)
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src)
    for (let j = s; j < e; j++) dst[j] = src[j] * (1 - (j - s) / len)
  }
  return result
}

export function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels
  const numSamples = buffer.length
  const interleaved = new Float32Array(numSamples * numChannels)
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      interleaved[i * numChannels + ch] = buffer.getChannelData(ch)[i]
    }
  }
  const dataSize = interleaved.byteLength
  const result = new ArrayBuffer(44 + dataSize)
  const view = new DataView(result)
  const write = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 3, true) // IEEE float PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * numChannels * 4, true)
  view.setUint16(32, numChannels * 4, true)
  view.setUint16(34, 32, true)
  write(36, 'data')
  view.setUint32(40, dataSize, true)
  new Uint8Array(result, 44).set(new Uint8Array(interleaved.buffer))
  return result
}

function tmpPath(suffix: string): Promise<string> {
  return tinker
    .getPath('temp')
    .then((d) => `${d}/tinker-audio-${Date.now()}${suffix}`)
}

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const task = tinker.runFFmpeg(args)
    ;(task as unknown as Promise<void>).then(resolve).catch(reject)
  })
}

export async function loadAudioFile(filePath: string): Promise<AudioBuffer> {
  const out = await tmpPath('.wav')
  await runFFmpeg(['-i', filePath, '-y', out])
  const response = await fetch(`file://${out}`)
  const arrayBuffer = await response.arrayBuffer()
  return getAudioCtx().decodeAudioData(arrayBuffer)
}

export async function exportAudio(
  buffer: AudioBuffer,
  outputPath: string
): Promise<void> {
  const wav = encodeWav(buffer)
  const tmp = await tmpPath('.wav')
  await tinker.writeFile(tmp, new Uint8Array(wav))
  await runFFmpeg(['-i', tmp, '-y', outputPath])
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${m}:${lpad(String(s), 2, '0')}.${lpad(String(ms), 2, '0')}`
}
