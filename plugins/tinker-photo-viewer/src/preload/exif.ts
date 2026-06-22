import sharp from 'sharp'
import type { PhotoExif } from '../common/types'

const EXIF_TAGS: Record<number, string> = {
  0x0132: 'dateTime',
  0x010f: 'make',
  0x0110: 'model',
  0x829a: 'exposureTime',
  0x829d: 'aperture',
  0x8827: 'iso',
  0x9003: 'dateTimeOriginal',
  0x9004: 'dateTimeDigitized',
  0x920a: 'focalLength',
  0xa405: 'focalLength',
}

interface ExifFields extends PhotoExif {
  dateTime?: string
  dateTimeOriginal?: string
  dateTimeDigitized?: string
}

function parseExifDateString(value: string): number | undefined {
  const trimmed = value.trim()
  const match = trimmed.match(
    /^(\d{4})[:/-](\d{2})[:/-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
  )
  if (!match) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const timestamp = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second
  ).getTime()

  return Number.isNaN(timestamp) ? undefined : timestamp
}

function pickTakenAt(fields: ExifFields): number | undefined {
  for (const value of [
    fields.dateTimeOriginal,
    fields.dateTimeDigitized,
    fields.dateTime,
  ]) {
    if (!value) continue
    const timestamp = parseExifDateString(value)
    if (timestamp !== undefined) return timestamp
  }
  return undefined
}

function finalizeExif(fields: ExifFields): PhotoExif | undefined {
  const takenAt = pickTakenAt(fields)
  const result: PhotoExif = {}

  if (fields.make) result.make = fields.make
  if (fields.model) result.model = fields.model
  if (fields.camera) result.camera = fields.camera
  if (fields.iso !== undefined) result.iso = fields.iso
  if (fields.aperture !== undefined) result.aperture = fields.aperture
  if (fields.exposureTime !== undefined) {
    result.exposureTime = fields.exposureTime
  }
  if (fields.focalLength !== undefined) result.focalLength = fields.focalLength
  if (takenAt !== undefined) result.takenAt = takenAt

  const hasData = Object.values(result).some((value) => value !== undefined)
  return hasData ? result : undefined
}

const BRAND_ALIASES: Record<string, string> = {
  'CASIO COMPUTER CO.,LTD.': 'CASIO',
  'NIKON CORPORATION': 'Nikon',
  'OLYMPUS IMAGING CORP.': 'Olympus',
}

function readUint16(
  buffer: Buffer,
  offset: number,
  littleEndian: boolean
): number {
  return littleEndian
    ? buffer.readUInt16LE(offset)
    : buffer.readUInt16BE(offset)
}

function readUint32(
  buffer: Buffer,
  offset: number,
  littleEndian: boolean
): number {
  return littleEndian
    ? buffer.readUInt32LE(offset)
    : buffer.readUInt32BE(offset)
}

function readInt32(
  buffer: Buffer,
  offset: number,
  littleEndian: boolean
): number {
  return littleEndian ? buffer.readInt32LE(offset) : buffer.readInt32BE(offset)
}

function readRational(
  buffer: Buffer,
  offset: number,
  littleEndian: boolean
): number | undefined {
  const numerator = readUint32(buffer, offset, littleEndian)
  const denominator = readUint32(buffer, offset + 4, littleEndian)
  if (!denominator) return undefined
  return numerator / denominator
}

function readAscii(buffer: Buffer, offset: number, length: number): string {
  return buffer
    .toString('ascii', offset, offset + length)
    .replace(/\0.*$/, '')
    .trim()
}

function parseIfd(
  buffer: Buffer,
  ifdOffset: number,
  tiffBase: number,
  littleEndian: boolean
): ExifFields {
  const result: ExifFields = {}
  if (ifdOffset + 2 > buffer.length) return result

  const entryCount = readUint16(buffer, ifdOffset, littleEndian)
  let offset = ifdOffset + 2

  for (let i = 0; i < entryCount; i++) {
    if (offset + 12 > buffer.length) break

    const tag = readUint16(buffer, offset, littleEndian)
    const type = readUint16(buffer, offset + 2, littleEndian)
    const count = readUint32(buffer, offset + 4, littleEndian)
    const valueOffset = offset + 8
    const field = EXIF_TAGS[tag]
    offset += 12

    if (!field) continue

    let value: string | number | undefined

    if (type === 2) {
      const strOffset =
        count > 4
          ? tiffBase + readUint32(buffer, valueOffset, littleEndian)
          : valueOffset
      if (strOffset + count <= buffer.length) {
        value = readAscii(buffer, strOffset, count)
      }
    } else if (type === 3) {
      value = readUint16(buffer, valueOffset, littleEndian)
    } else if (type === 5 && count === 1) {
      const rationalOffset =
        tiffBase + readUint32(buffer, valueOffset, littleEndian)
      value = readRational(buffer, rationalOffset, littleEndian)
    } else if (type === 10 && count === 1) {
      const rationalOffset =
        tiffBase + readUint32(buffer, valueOffset, littleEndian)
      const numerator = readInt32(buffer, rationalOffset, littleEndian)
      const denominator = readInt32(buffer, rationalOffset + 4, littleEndian)
      if (denominator) value = numerator / denominator
    }

    if (value === undefined) continue

    if (field === 'make' || field === 'model') {
      result[field] = String(value)
    } else if (
      field === 'dateTime' ||
      field === 'dateTimeOriginal' ||
      field === 'dateTimeDigitized'
    ) {
      result[field] = String(value)
    } else if (field === 'iso') {
      result.iso = Number(value)
    } else if (
      field === 'aperture' ||
      field === 'exposureTime' ||
      field === 'focalLength'
    ) {
      result[field] = Number(value)
    }
  }

  if (result.make || result.model) {
    let brand = result.make?.trim() || ''
    brand = BRAND_ALIASES[brand] || brand
    let model = result.model?.trim() || ''
    if (brand && model.toLowerCase().startsWith(brand.toLowerCase())) {
      model = model.slice(brand.length).trim()
    }
    result.camera = [brand, model].filter(Boolean).join(' ').trim() || undefined
  }

  return result
}

function findExifOffset(buffer: Buffer): number | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null

  let offset = 2
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) break
    const marker = buffer[offset + 1]
    if (marker === 0xda) break
    const segmentLength = readUint16(buffer, offset + 2, false)
    if (segmentLength < 2) break

    if (
      marker === 0xe1 &&
      offset + 10 < buffer.length &&
      buffer.toString('ascii', offset + 4, offset + 8) === 'Exif'
    ) {
      return offset + 10
    }

    offset += 2 + segmentLength
  }

  return null
}

function findTiffBase(buffer: Buffer): number | null {
  const jpegExif = findExifOffset(buffer)
  if (jpegExif !== null) return jpegExif

  if (buffer.length >= 8 && buffer.toString('ascii', 0, 4) === 'Exif') {
    return 6
  }

  const tiffHeader = buffer.toString('ascii', 0, 2)
  if (tiffHeader === 'II' || tiffHeader === 'MM') {
    return 0
  }

  return null
}

function parseTiffExif(
  buffer: Buffer,
  tiffBase: number
): PhotoExif | undefined {
  if (tiffBase + 8 > buffer.length) return undefined

  const tiffHeader = buffer.toString('ascii', tiffBase, tiffBase + 2)
  const littleEndian = tiffHeader === 'II'
  if (tiffHeader !== 'II' && tiffHeader !== 'MM') return undefined

  const ifd0Offset = readUint32(buffer, tiffBase + 4, littleEndian)
  const ifd0 = parseIfd(buffer, tiffBase + ifd0Offset, tiffBase, littleEndian)

  const exifIfdPointerOffset = tiffBase + ifd0Offset + 2
  let exifIfdOffset = 0
  const entryCount = readUint16(buffer, tiffBase + ifd0Offset, littleEndian)
  for (let i = 0; i < entryCount; i++) {
    const entryOffset = exifIfdPointerOffset + i * 12
    if (readUint16(buffer, entryOffset, littleEndian) === 0x8769) {
      exifIfdOffset = readUint32(buffer, entryOffset + 8, littleEndian)
      break
    }
  }

  const exifData =
    exifIfdOffset > 0
      ? parseIfd(buffer, tiffBase + exifIfdOffset, tiffBase, littleEndian)
      : {}

  const merged: ExifFields = { ...ifd0, ...exifData }
  if (!merged.camera && (merged.make || merged.model)) {
    merged.camera = [merged.make, merged.model].filter(Boolean).join(' ').trim()
  }

  return finalizeExif(merged)
}

export function parseExifBuffer(buffer: Buffer): PhotoExif | undefined {
  const tiffBase = findTiffBase(buffer)
  if (tiffBase === null) return undefined
  return parseTiffExif(buffer, tiffBase)
}

export function extractTakenAt(buffer: Buffer): number | undefined {
  return parseExifBuffer(buffer)?.takenAt
}

export async function readExifFromSharp(
  filePath: string
): Promise<PhotoExif | undefined> {
  try {
    const metadata = await sharp(filePath, { failOn: 'none' }).metadata()
    if (metadata.exif?.length) {
      return parseExifBuffer(metadata.exif)
    }
  } catch {
    return undefined
  }

  return undefined
}
