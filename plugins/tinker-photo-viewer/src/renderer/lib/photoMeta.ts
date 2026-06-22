import type { PhotoExif } from '../../common/types'
import fileSize from 'licia/fileSize'

interface FormattedExif {
  zone?: string
  focalLength35mm?: number
  focalLength?: number
  iso?: number
  shutterSpeed?: string
  aperture?: string
  maxAperture?: number
  camera?: string
  lens?: string
  lensMake?: string
  software?: string
  artist?: string
  copyright?: string
  colorSpace?: string
  rating?: number
  exposureMode?: string
  exposureProgram?: string
  meteringMode?: string
  whiteBalance?: string
  whiteBalanceBias?: number
  wbShiftAB?: string
  wbShiftGM?: string
  flash?: string
  flashMeteringMode?: string
  lightSource?: string
  sceneCaptureType?: string
  exposureBias?: string
  brightnessValue?: string
  shutterSpeedValue?: number
  apertureValue?: string
  sensingMethod?: string
  focalPlaneXResolution?: number
  focalPlaneYResolution?: number
  gps?: {
    latitude: string
    longitude: string
    altitude?: string
  }
}

function formatExposureTime(
  value?: number,
  fallback?: number
): string | undefined {
  const exposureTime = value ?? fallback
  if (exposureTime === undefined || Number.isNaN(exposureTime)) return undefined
  if (exposureTime >= 1) {
    return `${exposureTime.toFixed(exposureTime >= 10 ? 0 : 1)}s`
  }
  const denominator = Math.round(1 / exposureTime)
  return denominator > 0 ? `1/${denominator}s` : undefined
}

function formatAperture(value?: number): string | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined
  return `f/${Number(value.toFixed(1))}`
}

export function formatExifData(exif?: PhotoExif): FormattedExif | null {
  if (!exif) return null

  const shutterSpeed = formatExposureTime(
    exif.exposureTime,
    exif.shutterSpeedValue
  )
  const aperture = formatAperture(exif.aperture)
  const lens =
    exif.lensMake && exif.lensModel?.includes(exif.lensMake)
      ? exif.lensModel
      : exif.lensModel
  const gps = exif.gps
    ? {
        latitude: formatGpsCoordinate(
          exif.gps.latitude,
          exif.gps.latitudeRef || (exif.gps.latitude >= 0 ? 'N' : 'S')
        ),
        longitude: formatGpsCoordinate(
          exif.gps.longitude,
          exif.gps.longitudeRef || (exif.gps.longitude >= 0 ? 'E' : 'W')
        ),
        altitude:
          exif.gps.altitude !== undefined
            ? `${exif.gps.altitudeAboveSeaLevel === false ? '-' : ''}${
                exif.gps.altitude
              }`
            : undefined,
      }
    : undefined

  const formatted: FormattedExif = {
    zone: exif.offsetTime,
    focalLength35mm: exif.focalLength35mm,
    focalLength:
      exif.focalLength !== undefined ? Math.round(exif.focalLength) : undefined,
    iso: exif.iso,
    shutterSpeed,
    aperture,
    maxAperture: exif.maxApertureValue,
    camera: exif.camera,
    lens,
    lensMake: exif.lensMake,
    software: exif.software,
    artist: exif.artist,
    copyright: exif.copyright,
    colorSpace: exif.colorSpace,
    rating: exif.rating,
    exposureMode: exif.exposureMode,
    exposureProgram: exif.exposureProgram,
    meteringMode: exif.meteringMode,
    whiteBalance: exif.whiteBalance,
    whiteBalanceBias: exif.whiteBalanceBias,
    wbShiftAB: exif.wbShiftAB,
    wbShiftGM: exif.wbShiftGM,
    flash: exif.flash,
    flashMeteringMode: exif.flashMeteringMode,
    lightSource: exif.lightSource,
    sceneCaptureType: exif.sceneCaptureType,
    exposureBias:
      exif.exposureCompensation !== undefined
        ? `${exif.exposureCompensation} EV`
        : undefined,
    brightnessValue:
      exif.brightnessValue !== undefined
        ? `${exif.brightnessValue.toFixed(1)} EV`
        : undefined,
    shutterSpeedValue: exif.shutterSpeedValue,
    apertureValue:
      exif.apertureValue !== undefined
        ? `${exif.apertureValue.toFixed(1)} EV`
        : undefined,
    sensingMethod: exif.sensingMethod,
    focalPlaneXResolution: exif.focalPlaneXResolution
      ? Math.round(exif.focalPlaneXResolution)
      : undefined,
    focalPlaneYResolution: exif.focalPlaneYResolution
      ? Math.round(exif.focalPlaneYResolution)
      : undefined,
    gps,
  }

  return formatted
}

function formatGpsCoordinate(value: number, ref: string): string {
  const absolute = Math.abs(value)
  return `${absolute.toFixed(6)}° ${ref}`
}

export function formatFileSize(bytes: number): string {
  return fileSize(bytes)
}

export function formatMegapixels(width: number, height: number): string | null {
  if (!width || !height) return null
  return `${Math.floor((width * height) / 1_000_000)} MP`
}

export function formatFileSizeMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
