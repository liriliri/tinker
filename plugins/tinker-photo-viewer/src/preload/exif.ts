import exifr from 'exifr'
import type { PhotoExif, PhotoGps } from '../common/types'

const EXIF_PICK = [
  'Make',
  'Model',
  'LensModel',
  'LensMake',
  'Software',
  'Artist',
  'Copyright',
  'ISO',
  'FNumber',
  'ExposureTime',
  'FocalLength',
  'FocalLengthIn35mmFormat',
  'MaxApertureValue',
  'ExposureCompensation',
  'BrightnessValue',
  'ShutterSpeedValue',
  'ApertureValue',
  'Orientation',
  'ExposureProgram',
  'ExposureMode',
  'MeteringMode',
  'WhiteBalance',
  'Flash',
  'LightSource',
  'SceneCaptureType',
  'FlashMeteringMode',
  'ColorSpace',
  'Rating',
  'SensingMethod',
  'FocalPlaneXResolution',
  'FocalPlaneYResolution',
  'WhiteBalanceBias',
  'WBShiftAB',
  'WBShiftGM',
  'GPSAltitude',
  'GPSAltitudeRef',
  'GPSLatitude',
  'GPSLongitude',
  'GPSLatitudeRef',
  'GPSLongitudeRef',
  'OffsetTime',
  'OffsetTimeOriginal',
  'OffsetTimeDigitized',
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
  gps: true,
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

function pickIso(data: Record<string, unknown>): number | undefined {
  const iso = data.iso ?? data.ISO
  if (typeof iso === 'number' && Number.isFinite(iso)) return iso
  if (iso instanceof Uint16Array && iso.length > 0) return iso[0]
  return toNumber(iso)
}

function pickAltitudeRef(value: unknown): boolean | undefined {
  if (typeof value === 'number') return value === 0
  if (value instanceof Uint8Array && value.length > 0) return value[0] === 0
  return undefined
}

function pickGps(data: Record<string, unknown>): PhotoGps | undefined {
  const latitude =
    toNumber(data.latitude) ??
    toNumber(data.Latitude) ??
    toNumber(data.GPSLatitude)
  const longitude =
    toNumber(data.longitude) ??
    toNumber(data.Longitude) ??
    toNumber(data.GPSLongitude)

  if (latitude === undefined || longitude === undefined) return undefined

  const altitude = toNumber(data.gpsAltitude) ?? toNumber(data.GPSAltitude)
  const altitudeAboveSeaLevel = pickAltitudeRef(
    data.gpsAltitudeRef ?? data.GPSAltitudeRef
  )

  return {
    latitude,
    longitude,
    latitudeRef:
      toStringValue(data.gpsLatitudeRef) ?? toStringValue(data.GPSLatitudeRef),
    longitudeRef:
      toStringValue(data.gpsLongitudeRef) ??
      toStringValue(data.GPSLongitudeRef),
    altitude,
    altitudeAboveSeaLevel,
  }
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

function formatLens(make?: string, model?: string): string | undefined {
  if (make && model) return `${make} ${model}`.trim()
  return model || make
}

function mapExifrToPhotoExif(
  data: Record<string, unknown>
): PhotoExif | undefined {
  const make = toStringValue(data.make) ?? toStringValue(data.Make)
  const model = toStringValue(data.model) ?? toStringValue(data.Model)
  const lensMake = toStringValue(data.lensMake) ?? toStringValue(data.LensMake)
  const lensModel =
    toStringValue(data.lensModel) ?? toStringValue(data.LensModel)
  const iso = pickIso(data)
  const aperture = toNumber(data.fNumber) ?? toNumber(data.FNumber)
  const exposureTime =
    toNumber(data.exposureTime) ?? toNumber(data.ExposureTime)
  const focalLength = toNumber(data.focalLength) ?? toNumber(data.FocalLength)
  const focalLength35mm =
    toNumber(data.focalLengthIn35mmFormat) ??
    toNumber(data.FocalLengthIn35mmFormat)
  const takenAt = pickTakenAt(data)
  const gps = pickGps(data)

  const result: PhotoExif = {}
  if (make) result.make = make
  if (model) result.model = model
  result.camera = formatCamera(make, model)
  result.lensMake = lensMake
  result.lensModel = formatLens(lensMake, lensModel)
  result.software = toStringValue(data.software) ?? toStringValue(data.Software)
  result.artist = toStringValue(data.artist) ?? toStringValue(data.Artist)
  result.copyright =
    toStringValue(data.copyright) ?? toStringValue(data.Copyright)
  result.colorSpace =
    toStringValue(data.colorSpace) ?? toStringValue(data.ColorSpace)
  result.rating = toNumber(data.rating) ?? toNumber(data.Rating)
  if (iso !== undefined) result.iso = iso
  if (aperture !== undefined) result.aperture = aperture
  if (exposureTime !== undefined) result.exposureTime = exposureTime
  if (focalLength !== undefined) result.focalLength = focalLength
  if (focalLength35mm !== undefined) result.focalLength35mm = focalLength35mm
  result.maxApertureValue =
    toNumber(data.maxApertureValue) ?? toNumber(data.MaxApertureValue)
  result.exposureCompensation =
    toNumber(data.exposureCompensation) ?? toNumber(data.ExposureCompensation)
  result.brightnessValue =
    toNumber(data.brightnessValue) ?? toNumber(data.BrightnessValue)
  result.shutterSpeedValue =
    toNumber(data.shutterSpeedValue) ?? toNumber(data.ShutterSpeedValue)
  result.apertureValue =
    toNumber(data.apertureValue) ?? toNumber(data.ApertureValue)
  result.exposureProgram =
    toStringValue(data.exposureProgram) ?? toStringValue(data.ExposureProgram)
  result.exposureMode =
    toStringValue(data.exposureMode) ?? toStringValue(data.ExposureMode)
  result.meteringMode =
    toStringValue(data.meteringMode) ?? toStringValue(data.MeteringMode)
  result.whiteBalance =
    toStringValue(data.whiteBalance) ?? toStringValue(data.WhiteBalance)
  result.whiteBalanceBias =
    toNumber(data.whiteBalanceBias) ?? toNumber(data.WhiteBalanceBias)
  result.wbShiftAB =
    toStringValue(data.wbShiftAB) ?? toStringValue(data.WBShiftAB)
  result.wbShiftGM =
    toStringValue(data.wbShiftGM) ?? toStringValue(data.WBShiftGM)
  result.flash = toStringValue(data.flash) ?? toStringValue(data.Flash)
  result.flashMeteringMode =
    toStringValue(data.flashMeteringMode) ??
    toStringValue(data.FlashMeteringMode)
  result.lightSource =
    toStringValue(data.lightSource) ?? toStringValue(data.LightSource)
  result.sceneCaptureType =
    toStringValue(data.sceneCaptureType) ?? toStringValue(data.SceneCaptureType)
  result.sensingMethod =
    toStringValue(data.sensingMethod) ?? toStringValue(data.SensingMethod)
  result.focalPlaneXResolution =
    toNumber(data.focalPlaneXResolution) ?? toNumber(data.FocalPlaneXResolution)
  result.focalPlaneYResolution =
    toNumber(data.focalPlaneYResolution) ?? toNumber(data.FocalPlaneYResolution)
  result.offsetTime =
    toStringValue(data.offsetTime) ??
    toStringValue(data.OffsetTime) ??
    toStringValue(data.offsetTimeOriginal) ??
    toStringValue(data.OffsetTimeOriginal)
  result.orientation = toNumber(data.orientation) ?? toNumber(data.Orientation)
  if (takenAt !== undefined) result.takenAt = takenAt
  if (gps) result.gps = gps

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
