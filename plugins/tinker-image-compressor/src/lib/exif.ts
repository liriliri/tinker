// Extract APP1/EXIF segment from a JPEG buffer
export function extractJpegExif(buffer: Uint8Array): Uint8Array | null {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null
  let i = 2
  while (i + 3 < buffer.length) {
    if (buffer[i] !== 0xff) break
    const marker = buffer[i + 1]
    if (marker === 0xda) break // SOS
    const segLen = (buffer[i + 2] << 8) | buffer[i + 3]
    if (
      marker === 0xe1 &&
      i + 9 < buffer.length &&
      buffer[i + 4] === 0x45 && // E
      buffer[i + 5] === 0x78 && // x
      buffer[i + 6] === 0x69 && // i
      buffer[i + 7] === 0x66 && // f
      buffer[i + 8] === 0x00 &&
      buffer[i + 9] === 0x00
    ) {
      return buffer.slice(i, i + 2 + segLen)
    }
    i += 2 + segLen
  }
  return null
}

// Inject EXIF segment into a JPEG buffer after SOI (and APP0 if present)
export function injectJpegExif(
  buffer: Uint8Array,
  exifSegment: Uint8Array
): Uint8Array<ArrayBuffer> {
  let insertPos = 2
  if (buffer.length > 5 && buffer[2] === 0xff && buffer[3] === 0xe0) {
    insertPos = 2 + 2 + ((buffer[4] << 8) | buffer[5])
  }
  const result = new Uint8Array(buffer.length + exifSegment.length)
  result.set(buffer.slice(0, insertPos))
  result.set(exifSegment, insertPos)
  result.set(buffer.slice(insertPos), insertPos + exifSegment.length)
  return result
}
