function readUint16(
  buffer: Buffer,
  offset: number,
  littleEndian: boolean
): number {
  return littleEndian
    ? buffer.readUInt16LE(offset)
    : buffer.readUInt16BE(offset)
}

export function readImageSize(
  buffer: Buffer,
  ext: string
): { width: number; height: number } | null {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return readJpegSize(buffer)
    case 'png':
      return readPngSize(buffer)
    case 'gif':
      return readGifSize(buffer)
    case 'webp':
      return readWebpSize(buffer)
    case 'bmp':
      return readBmpSize(buffer)
    default:
      return null
  }
}

function readJpegSize(
  buffer: Buffer
): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null

  let offset = 2
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) break
    const marker = buffer[offset + 1]
    const length = readUint16(buffer, offset + 2, false)
    if (length < 2) break

    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = readUint16(buffer, offset + 5, false)
      const width = readUint16(buffer, offset + 7, false)
      if (width > 0 && height > 0) return { width, height }
      return null
    }

    offset += 2 + length
  }

  return null
}

function readPngSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null
  const signature = buffer.toString('ascii', 1, 4)
  if (signature !== 'PNG') return null
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

function readGifSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 10) return null
  if (buffer.toString('ascii', 0, 3) !== 'GIF') return null
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  }
}

function readWebpSize(
  buffer: Buffer
): { width: number; height: number } | null {
  if (buffer.length < 30) return null
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null
  if (buffer.toString('ascii', 8, 12) !== 'WEBP') return null

  const chunkType = buffer.toString('ascii', 12, 16)
  if (chunkType === 'VP8 ') {
    if (buffer.length < 30) return null
    const width = buffer.readUInt16LE(26) & 0x3fff
    const height = buffer.readUInt16LE(28) & 0x3fff
    return { width, height }
  }

  if (chunkType === 'VP8L') {
    if (buffer.length < 25) return null
    const bits =
      buffer[21] | (buffer[22] << 8) | (buffer[23] << 16) | (buffer[24] << 24)
    const width = (bits & 0x3fff) + 1
    const height = ((bits >> 14) & 0x3fff) + 1
    return { width, height }
  }

  if (chunkType === 'VP8X') {
    if (buffer.length < 30) return null
    const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16))
    const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16))
    return { width, height }
  }

  return null
}

function readBmpSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 26) return null
  if (buffer.toString('ascii', 0, 2) !== 'BM') return null
  const width = buffer.readInt32LE(18)
  const height = Math.abs(buffer.readInt32LE(22))
  if (width <= 0 || height <= 0) return null
  return { width, height }
}
