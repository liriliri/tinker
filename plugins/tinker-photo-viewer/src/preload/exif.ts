import exifr from 'exifr'
import type { PhotoExif } from '../common/types'

const EXIF_PICK = [
  'Make',
  'Model',
  'ISO',
  'FNumber',
  'ExposureTime',
  'FocalLength',
  'DateTimeOriginal',
  'DateTimeDigitized',
  'DateTime',
  'CreateDate',
  'ModifyDate',
] as const

const DATE_PICK = [
  'DateTimeOriginal',
  'DateTimeDigitized',
  'DateTime',
  'CreateDate',
  'ModifyDate',
] as const

const PARSE_OPTIONS = {
  pick: [...EXIF_PICK],
  reviveValues: true,
  translateKeys: true,
}

const DATE_PARSE_OPTIONS = {
  pick: [...DATE_PICK],
  reviveValues: true,
  translateKeys: true,
}

const BRAND_ALIASES: Record<string, string> = {
  'CASIO COMPUTER CO.,LTD.': 'CASIO',
  'NIKON CORPORATION': 'Nikon',
  'OLYMPUS IMAGING CORP.': 'Olympus',
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function pickTakenAt(data: Record<string, unknown>): number | undefined {
  for (const key of [
    'dateTimeOriginal',
    'dateTimeDigitized',
    'dateTime',
    'createDate',
    'modifyDate',
    'DateTimeOriginal',
    'DateTimeDigitized',
    'DateTime',
    'CreateDate',
    'ModifyDate',
  ]) {
    const value = data[key]
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.getTime()
    }
  }
  return undefined
}

function formatCamera(make?: string, model?: string): string | undefined {
  if (!make && !model) return undefined

  let brand = make?.trim() || ''
  brand = BRAND_ALIASES[brand] || brand
  let cameraModel = model?.trim() || ''
  if (brand && cameraModel.toLowerCase().startsWith(brand.toLowerCase())) {
    cameraModel = cameraModel.slice(brand.length).trim()
  }

  const camera = [brand, cameraModel].filter(Boolean).join(' ').trim()
  return camera || undefined
}

function mapExifrToPhotoExif(
  data: Record<string, unknown>
): PhotoExif | undefined {
  const make = toStringValue(data.make) ?? toStringValue(data.Make)
  const model = toStringValue(data.model) ?? toStringValue(data.Model)
  const iso = toNumber(data.iso) ?? toNumber(data.ISO)
  const aperture = toNumber(data.fNumber) ?? toNumber(data.FNumber)
  const exposureTime =
    toNumber(data.exposureTime) ?? toNumber(data.ExposureTime)
  const focalLength = toNumber(data.focalLength) ?? toNumber(data.FocalLength)
  const takenAt = pickTakenAt(data)

  const result: PhotoExif = {}
  if (make) result.make = make
  if (model) result.model = model
  result.camera = formatCamera(make, model)
  if (iso !== undefined) result.iso = iso
  if (aperture !== undefined) result.aperture = aperture
  if (exposureTime !== undefined) result.exposureTime = exposureTime
  if (focalLength !== undefined) result.focalLength = focalLength
  if (takenAt !== undefined) result.takenAt = takenAt

  const hasData = Object.values(result).some((value) => value !== undefined)
  return hasData ? result : undefined
}

async function parseExifr(
  input: string | Buffer
): Promise<PhotoExif | undefined> {
  try {
    const data = await exifr.parse(input, PARSE_OPTIONS)
    if (!data || typeof data !== 'object') return undefined
    return mapExifrToPhotoExif(data as Record<string, unknown>)
  } catch {
    return undefined
  }
}

export async function readExifFromFile(
  filePath: string
): Promise<PhotoExif | undefined> {
  return parseExifr(filePath)
}

export async function extractTakenAtFromFile(
  filePath: string
): Promise<number | undefined> {
  try {
    const data = await exifr.parse(filePath, DATE_PARSE_OPTIONS)
    if (!data || typeof data !== 'object') return undefined
    return pickTakenAt(data as Record<string, unknown>)
  } catch {
    return undefined
  }
}
