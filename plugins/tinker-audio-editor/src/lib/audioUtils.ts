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

export function insertSilenceBuffer(
  buffer: AudioBuffer,
  offset: number,
  duration: number
): AudioBuffer {
  const o = secToSample(buffer, offset)
  const silenceSamples = secToSample(buffer, duration)
  const result = newBuffer(buffer, buffer.length + silenceSamples)
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src.subarray(0, o))
    // silence region is already zero-filled by default
    dst.set(src.subarray(o), o + silenceSamples)
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

export function gainBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number,
  factor: number
): AudioBuffer {
  const s = secToSample(buffer, start)
  const e = secToSample(buffer, end)
  const result = newBuffer(buffer, buffer.length)
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src)
    for (let j = s; j < e; j++) dst[j] = src[j] * factor
  }
  return result
}

export function normalizeBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number,
  maxVal = 1.0,
  equally = true
): AudioBuffer {
  const s = secToSample(buffer, start)
  const e = secToSample(buffer, end)
  const result = newBuffer(buffer, buffer.length)

  if (equally) {
    let peak = 0
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const data = buffer.getChannelData(i)
      for (let j = s; j < e; j++) {
        const abs = Math.abs(data[j])
        if (abs > peak) peak = abs
      }
    }
    if (peak === 0) return buffer
    const factor = maxVal / peak
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const src = buffer.getChannelData(i)
      const dst = result.getChannelData(i)
      dst.set(src)
      for (let j = s; j < e; j++) dst[j] = src[j] * factor
    }
  } else {
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const src = buffer.getChannelData(i)
      const dst = result.getChannelData(i)
      dst.set(src)
      let peak = 0
      for (let j = s; j < e; j++) {
        const abs = Math.abs(src[j])
        if (abs > peak) peak = abs
      }
      if (peak === 0) continue
      const factor = maxVal / peak
      for (let j = s; j < e; j++) dst[j] = src[j] * factor
    }
  }

  return result
}

export function speedBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number,
  rate: number
): AudioBuffer {
  const s = secToSample(buffer, start)
  const e = secToSample(buffer, end)
  const selLen = e - s
  // New length of the selection after resampling (inverse of rate)
  const newSelLen = Math.round(selLen / rate)
  const result = newBuffer(buffer, buffer.length - selLen + newSelLen)
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    // Copy pre-selection
    dst.set(src.subarray(0, s))
    // Resample selection with linear interpolation
    for (let j = 0; j < newSelLen; j++) {
      const srcPos = (j / newSelLen) * selLen
      const lo = Math.floor(srcPos)
      const hi = Math.min(lo + 1, selLen - 1)
      const frac = srcPos - lo
      dst[s + j] = src[s + lo] * (1 - frac) + src[s + hi] * frac
    }
    // Copy post-selection
    dst.set(src.subarray(e), s + newSelLen)
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

export async function loadAudioFile(filePath: string): Promise<AudioBuffer> {
  const out = await tmpPath('.wav')
  await tinker.runFFmpeg(['-i', filePath, '-y', out])
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
  await tinker.runFFmpeg(['-i', tmp, '-y', outputPath])
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${m}:${lpad(String(s), 2, '0')}.${lpad(String(ms), 2, '0')}`
}
