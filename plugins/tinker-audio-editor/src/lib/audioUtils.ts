// AudioBuffer manipulation utilities

export function trimBuffer(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const sr = buffer.sampleRate
  const ch = buffer.numberOfChannels
  const s = Math.max(0, Math.floor(start * sr))
  const e = Math.min(buffer.length, Math.floor(end * sr))
  const len = Math.max(1, e - s)

  const result = new OfflineAudioContext(ch, len, sr).createBuffer(ch, len, sr)
  for (let i = 0; i < ch; i++) {
    result.getChannelData(i).set(buffer.getChannelData(i).slice(s, e))
  }
  return result
}

export function deleteSelection(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const sr = buffer.sampleRate
  const ch = buffer.numberOfChannels
  const s = Math.max(0, Math.floor(start * sr))
  const e = Math.min(buffer.length, Math.floor(end * sr))
  const newLen = Math.max(1, buffer.length - (e - s))

  const result = new OfflineAudioContext(ch, newLen, sr).createBuffer(
    ch,
    newLen,
    sr
  )
  for (let i = 0; i < ch; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src.slice(0, s), 0)
    dst.set(src.slice(e), s)
  }
  return result
}

export function silenceSelection(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const sr = buffer.sampleRate
  const ch = buffer.numberOfChannels
  const s = Math.max(0, Math.floor(start * sr))
  const e = Math.min(buffer.length, Math.floor(end * sr))

  const result = new OfflineAudioContext(ch, buffer.length, sr).createBuffer(
    ch,
    buffer.length,
    sr
  )
  for (let i = 0; i < ch; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src)
    dst.fill(0, s, e)
  }
  return result
}

export function reverseBuffer(
  buffer: AudioBuffer,
  start?: number,
  end?: number
): AudioBuffer {
  const sr = buffer.sampleRate
  const ch = buffer.numberOfChannels
  const s = start !== undefined ? Math.max(0, Math.floor(start * sr)) : 0
  const e =
    end !== undefined
      ? Math.min(buffer.length, Math.floor(end * sr))
      : buffer.length

  const result = new OfflineAudioContext(ch, buffer.length, sr).createBuffer(
    ch,
    buffer.length,
    sr
  )
  for (let i = 0; i < ch; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src)
    const seg = Array.from(dst.slice(s, e)).reverse()
    dst.set(seg, s)
  }
  return result
}

export function normalizeBuffer(buffer: AudioBuffer): AudioBuffer {
  const sr = buffer.sampleRate
  const ch = buffer.numberOfChannels

  let peak = 0
  for (let i = 0; i < ch; i++) {
    const data = buffer.getChannelData(i)
    for (let j = 0; j < data.length; j++) {
      const abs = Math.abs(data[j])
      if (abs > peak) peak = abs
    }
  }
  const gain = peak > 0 ? 1 / peak : 1

  const result = new OfflineAudioContext(ch, buffer.length, sr).createBuffer(
    ch,
    buffer.length,
    sr
  )
  for (let i = 0; i < ch; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    for (let j = 0; j < src.length; j++) {
      dst[j] = src[j] * gain
    }
  }
  return result
}

export function fadeIn(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const sr = buffer.sampleRate
  const ch = buffer.numberOfChannels
  const s = Math.max(0, Math.floor(start * sr))
  const e = Math.min(buffer.length, Math.floor(end * sr))
  const len = e - s

  const result = new OfflineAudioContext(ch, buffer.length, sr).createBuffer(
    ch,
    buffer.length,
    sr
  )
  for (let i = 0; i < ch; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src)
    for (let j = 0; j < len; j++) {
      dst[s + j] *= j / len
    }
  }
  return result
}

export function fadeOut(
  buffer: AudioBuffer,
  start: number,
  end: number
): AudioBuffer {
  const sr = buffer.sampleRate
  const ch = buffer.numberOfChannels
  const s = Math.max(0, Math.floor(start * sr))
  const e = Math.min(buffer.length, Math.floor(end * sr))
  const len = e - s

  const result = new OfflineAudioContext(ch, buffer.length, sr).createBuffer(
    ch,
    buffer.length,
    sr
  )
  for (let i = 0; i < ch; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    dst.set(src)
    for (let j = 0; j < len; j++) {
      dst[s + j] *= 1 - j / len
    }
  }
  return result
}

export function applyGain(
  buffer: AudioBuffer,
  gainFactor: number
): AudioBuffer {
  const sr = buffer.sampleRate
  const ch = buffer.numberOfChannels

  const result = new OfflineAudioContext(ch, buffer.length, sr).createBuffer(
    ch,
    buffer.length,
    sr
  )
  for (let i = 0; i < ch; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    for (let j = 0; j < src.length; j++) {
      dst[j] = Math.max(-1, Math.min(1, src[j] * gainFactor))
    }
  }
  return result
}

export function pasteIntoBuffer(
  buffer: AudioBuffer,
  clipboard: AudioBuffer,
  offset: number
): AudioBuffer {
  const sr = buffer.sampleRate
  const ch = buffer.numberOfChannels
  const off = Math.max(0, Math.floor(offset * sr))
  const newLen = buffer.length + clipboard.length

  const result = new OfflineAudioContext(ch, newLen, sr).createBuffer(
    ch,
    newLen,
    sr
  )
  for (let i = 0; i < ch; i++) {
    const src = buffer.getChannelData(i)
    const dst = result.getChannelData(i)
    const clip =
      clipboard.numberOfChannels > i
        ? clipboard.getChannelData(i)
        : clipboard.getChannelData(0)
    dst.set(src.slice(0, off), 0)
    dst.set(clip, off)
    dst.set(src.slice(off), off + clipboard.length)
  }
  return result
}

export function encodeWav(buffer: AudioBuffer): Blob {
  const ch = buffer.numberOfChannels
  const sr = buffer.sampleRate
  const len = buffer.length
  const bps = 16
  const dataSize = len * ch * (bps / 8)
  const ab = new ArrayBuffer(44 + dataSize)
  const view = new DataView(ab)

  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i))
  }
  str(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, ch, true)
  view.setUint32(24, sr, true)
  view.setUint32(28, sr * ch * (bps / 8), true)
  view.setUint16(32, ch * (bps / 8), true)
  view.setUint16(34, bps, true)
  str(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}
