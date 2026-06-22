import type { PhotoExif } from '../../common/types'
import fileSize from 'licia/fileSize'
import some from 'licia/some'
import values from 'licia/values'

interface FormattedExif {
  camera?: string
  iso?: string
  aperture?: string
  shutterSpeed?: string
  focalLength?: string
}

export function formatExposureTime(value?: number): string | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined
  if (value >= 1) return `${value.toFixed(value >= 10 ? 0 : 1)}s`
  const denominator = Math.round(1 / value)
  return denominator > 0 ? `1/${denominator}s` : undefined
}

export function formatAperture(value?: number): string | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined
  const rounded = Number(value.toFixed(1))
  return `f/${rounded}`
}

export function formatFocalLength(value?: number): string | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined
  const rounded = Math.round(value)
  return `${rounded}mm`
}

export function formatExifData(exif?: PhotoExif): FormattedExif | null {
  if (!exif) return null

  const formatted: FormattedExif = {
    camera: exif.camera,
    iso: exif.iso !== undefined ? String(exif.iso) : undefined,
    aperture: formatAperture(exif.aperture),
    shutterSpeed: formatExposureTime(exif.exposureTime),
    focalLength: formatFocalLength(exif.focalLength),
  }

  const hasData = some(values(formatted), Boolean)
  return hasData ? formatted : null
}

export function formatFileSize(bytes: number): string {
  return fileSize(bytes)
}

export function formatMegapixels(width: number, height: number): string | null {
  if (!width || !height) return null
  return `${Math.floor((width * height) / 1_000_000)} MP`
}
