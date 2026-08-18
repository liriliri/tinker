import every from 'licia/every'
import find from 'licia/find'
import max from 'licia/max'
import min from 'licia/min'

const ID_SEGMENT = 0x8538067
const ID_INFO = 0x549a966
const ID_TIMECODE_SCALE = 0xad7b1
const ID_DURATION = 0x489
const ID_CLUSTER = 0xf43b675

interface Element {
  offset: number
  id: number
  idSize: number
  sizeSize: number
  dataStart: number
  dataEnd: number
}

function readVint(source: Uint8Array, offset: number) {
  const first = source[offset]
  const extra = 8 - first.toString(2).length
  const size = extra + 1
  let value = first - (1 << (7 - extra))
  for (let i = 1; i < size; i++) {
    value = value * 256 + source[offset + i]
  }
  return { value, size }
}

function writeVint(x: number) {
  let size = 1
  let flag = 0x80
  while (x >= flag && size < 8) {
    size++
    flag *= 0x80
  }
  return writeVintWidth(x, size)
}

function writeVintWidth(value: number, size: number) {
  const out = new Uint8Array(size)
  let rest = value
  for (let i = size - 1; i > 0; i--) {
    out[i] = rest % 256
    rest = (rest - (rest % 256)) / 256
  }
  out[0] = (1 << (8 - size)) | rest
  return out
}

function concat(parts: Uint8Array[]) {
  let length = 0
  for (const part of parts) length += part.length
  const out = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function readElement(
  source: Uint8Array,
  offset: number,
  limit: number
): Element {
  const id = readVint(source, offset)
  const len = readVint(source, offset + id.size)
  const dataStart = offset + id.size + len.size
  return {
    offset,
    id: id.value,
    idSize: id.size,
    sizeSize: len.size,
    dataStart,
    dataEnd: min(dataStart + len.value, limit),
  }
}

function findElement(
  source: Uint8Array,
  start: number,
  limit: number,
  targetId: number
) {
  let offset = start
  while (offset < limit) {
    const el = readElement(source, offset, limit)
    if (el.id === targetId) return el
    offset = el.dataEnd
  }
  return null
}

function parseChildren(source: Uint8Array, start: number, end: number) {
  const sections: { id: number; data: Uint8Array }[] = []
  let offset = start
  while (offset < end) {
    const el = readElement(source, offset, end)
    sections.push({
      id: el.id,
      data: source.subarray(el.dataStart, el.dataEnd),
    })
    offset = el.dataEnd
  }
  return sections
}

function encodeElement(id: number, data: Uint8Array) {
  return concat([writeVint(id), writeVint(data.length), data])
}

function encodeChildren(sections: { id: number; data: Uint8Array }[]) {
  return concat(
    sections.map((section) => encodeElement(section.id, section.data))
  )
}

function writeUint(value: number, length: number) {
  const out = new Uint8Array(length)
  for (let i = length - 1; i >= 0; i--) {
    out[i] = value % 256
    value = (value - (value % 256)) / 256
  }
  return out
}

function writeFloat64(value: number) {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setFloat64(0, value)
  return bytes
}

function isUnknownSize(source: Uint8Array, el: Element) {
  if (el.sizeSize !== 8) return false
  const start = el.offset + el.idSize
  if (source[start] !== 0x01) return false
  return every(source.subarray(start + 1, start + 8), (byte) => byte === 0xff)
}

function readFloat(data: Uint8Array) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  return data.length === 4 ? view.getFloat32(0) : view.getFloat64(0)
}

function writeSize(bytes: Uint8Array, el: Element, dataLen: number) {
  bytes.set(writeVintWidth(dataLen, el.sizeSize), el.offset + el.idSize)
}

function clusterEnd(source: Uint8Array, cluster: Element) {
  let offset = cluster.dataStart
  while (offset < source.length) {
    const el = readElement(source, offset, source.length)
    if (el.id === ID_CLUSTER) return offset
    if (isUnknownSize(source, el)) break
    offset = el.dataEnd
  }
  return source.length
}

function patchUnknownSizes(bytes: Uint8Array) {
  const out = bytes.slice()
  const segment = findElement(out, 0, out.length, ID_SEGMENT)
  if (!segment) return out

  let offset = segment.dataStart
  while (offset < out.length) {
    const el = readElement(out, offset, out.length)
    if (el.id === ID_CLUSTER && isUnknownSize(out, el)) {
      const end = clusterEnd(out, el)
      writeSize(out, el, end - el.dataStart)
      offset = end
      continue
    }
    offset = el.dataEnd
  }

  if (isUnknownSize(out, segment)) {
    writeSize(out, segment, out.length - segment.dataStart)
  }
  return out
}

function patchDuration(bytes: Uint8Array, durationMs: number) {
  const segment = findElement(bytes, 0, bytes.length, ID_SEGMENT)
  if (!segment) return bytes

  const info = findElement(bytes, segment.dataStart, segment.dataEnd, ID_INFO)
  if (!info) return bytes

  const sections = parseChildren(bytes, info.dataStart, info.dataEnd)
  const scale = find(sections, (section) => section.id === ID_TIMECODE_SCALE)
  if (!scale) return bytes

  const duration = find(sections, (section) => section.id === ID_DURATION)
  if (duration) {
    if (readFloat(duration.data) > 0) return bytes
    duration.data = writeFloat64(durationMs)
  } else {
    sections.push({ id: ID_DURATION, data: writeFloat64(durationMs) })
  }

  scale.data = writeUint(1000000, max(scale.data.length, 3))
  const newInfo = encodeElement(ID_INFO, encodeChildren(sections))
  const spliced = concat([
    bytes.subarray(0, info.offset),
    newInfo,
    bytes.subarray(info.dataEnd),
  ])

  if (isUnknownSize(bytes, segment)) return spliced

  const delta = newInfo.length - (info.dataEnd - info.offset)
  const newSize = encodeElement(
    ID_SEGMENT,
    spliced.subarray(segment.dataStart, segment.dataEnd + delta)
  )
  return concat([
    bytes.subarray(0, segment.offset),
    newSize,
    spliced.subarray(segment.dataEnd + delta),
  ])
}

export function setWebmDuration(bytes: Uint8Array, durationMs: number) {
  try {
    const withDuration =
      durationMs > 0 ? patchDuration(bytes, durationMs) : bytes
    return patchUnknownSizes(withDuration)
  } catch {
    return bytes
  }
}
