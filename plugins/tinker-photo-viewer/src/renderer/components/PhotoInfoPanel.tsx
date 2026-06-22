import { observer } from 'mobx-react-lite'
import { Children, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import isStrBlank from 'licia/isStrBlank'
import { tw } from 'share/theme'
import type { PhotoExif } from '../../common/types'
import {
  formatExifData,
  formatFileSizeMb,
  formatMegapixels,
} from '../lib/photoMeta'
import store from '../store'
import type { Photo } from '../types'

interface PhotoInfoPanelProps {
  photo: Photo
}

function hasDisplayValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return !isStrBlank(value)
  if (typeof value === 'number') return !Number.isNaN(value)
  return true
}

interface InfoRowProps {
  label: string
  value: unknown
  ellipsis?: boolean
}

function InfoRow({ label, value, ellipsis = false }: InfoRowProps) {
  if (!hasDisplayValue(value)) return null

  const text = String(value)

  return (
    <div className="flex justify-between py-1.5">
      <span className={tw.text.secondary}>{label}</span>
      {ellipsis ? (
        <span
          className={`ml-4 min-w-0 max-w-[55%] truncate text-right ${tw.text.primary}`}
          title={text}
        >
          {text}
        </span>
      ) : (
        <span className={tw.text.primary}>{text}</span>
      )}
    </div>
  )
}

interface InfoSectionProps {
  title: string
  children: ReactNode
  className?: string
}

function InfoSection({
  title,
  children,
  className = 'py-2',
}: InfoSectionProps) {
  const items = Children.toArray(children).filter(Boolean)
  if (items.length === 0) return null

  return (
    <div className={className}>
      <h4 className={`mb-1 text-sm font-semibold ${tw.primary.text}`}>
        {title}
      </h4>
      {items}
    </div>
  )
}

const PhotoInfoPanel = observer(function PhotoInfoPanel({
  photo,
}: PhotoInfoPanelProps) {
  const { t, i18n } = useTranslation()
  const [exif, setExif] = useState<PhotoExif | undefined>()

  useEffect(() => {
    let cancelled = false
    setExif(undefined)

    void photoViewer
      .readPhotoExif(photo.path)
      .then((data) => {
        if (!cancelled) setExif(data)
      })
      .catch(() => {
        if (!cancelled) setExif(undefined)
      })

    return () => {
      cancelled = true
    }
  }, [photo.path])

  const exifData = useMemo(
    () => formatExifData(exif, i18n.language),
    [exif, i18n.language]
  )

  const dateTakenLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(new Date(photo.createdAt)),
    [photo.createdAt, i18n.language]
  )

  const megapixels = useMemo(() => {
    if (photo.width <= 0 || photo.height <= 0) return null
    return formatMegapixels(photo.width, photo.height)
  }, [photo.width, photo.height])

  const dimensions =
    photo.width > 0 && photo.height > 0
      ? `${photo.width}×${photo.height}`
      : null

  const focalPlaneResolution = useMemo(() => {
    if (!exifData) return null
    const { focalPlaneXResolution: x, focalPlaneYResolution: y } = exifData
    if (x && y) return `${x} × ${y}`
    if (x) return String(x)
    if (y) return String(y)
    return null
  }, [exifData])

  return (
    <aside
      className={`flex h-full w-80 shrink-0 flex-col border-l ${tw.border} ${tw.bg.tertiary}`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className={`text-sm divide-y ${tw.divide}`}>
          <InfoSection title={t('basicInfo')} className="pb-2">
            <InfoRow label={t('fileName')} value={photo.title} ellipsis />
            <InfoRow label={t('format')} value={photo.format} />
            <InfoRow label={t('dimensions')} value={dimensions} />
            <InfoRow
              label={t('fileSize')}
              value={photo.size > 0 ? formatFileSizeMb(photo.size) : null}
            />
            <InfoRow label={t('megapixels')} value={megapixels} />
            <InfoRow label={t('dateTaken')} value={dateTakenLabel} />
            <InfoRow label={t('colorSpace')} value={exifData?.colorSpace} />
            <InfoRow
              label={t('rating')}
              value={
                exifData?.rating && exifData.rating > 0
                  ? '★'.repeat(exifData.rating)
                  : null
              }
            />
            <InfoRow label={t('timeZone')} value={exifData?.zone} />
            <InfoRow label={t('artist')} value={exifData?.artist} />
            <InfoRow label={t('copyright')} value={exifData?.copyright} />
            <InfoRow label={t('software')} value={exifData?.software} />
          </InfoSection>

          {exifData ? (
            <>
              <InfoSection title={t('captureParameters')}>
                <InfoRow
                  label={t('focalLengthEquivalent')}
                  value={
                    exifData.focalLength35mm
                      ? `${exifData.focalLength35mm}mm`
                      : null
                  }
                />
                <InfoRow label={t('aperture')} value={exifData.aperture} />
                <InfoRow
                  label={t('shutterSpeed')}
                  value={exifData.shutterSpeed}
                />
                <InfoRow label={t('iso')} value={exifData.iso} />
                <InfoRow
                  label={t('exposureCompensation')}
                  value={exifData.exposureBias}
                />
              </InfoSection>

              <InfoSection title={t('deviceInfo')}>
                <InfoRow label={t('camera')} value={exifData.camera} />
                <InfoRow label={t('lens')} value={exifData.lens} />
                <InfoRow
                  label={t('lensMake')}
                  value={
                    exifData.lensMake &&
                    exifData.lens &&
                    !exifData.lens.includes(exifData.lensMake)
                      ? exifData.lensMake
                      : null
                  }
                />
                <InfoRow
                  label={t('focalLengthActual')}
                  value={
                    exifData.focalLength ? `${exifData.focalLength}mm` : null
                  }
                />
                <InfoRow
                  label={t('focalLengthEquivalent')}
                  value={
                    exifData.focalLength35mm
                      ? `${exifData.focalLength35mm}mm`
                      : null
                  }
                />
                <InfoRow
                  label={t('maxAperture')}
                  value={
                    exifData.maxAperture ? `f/${exifData.maxAperture}` : null
                  }
                />
              </InfoSection>

              <InfoSection title={t('captureMode')}>
                <InfoRow
                  label={t('exposureProgram')}
                  value={exifData.exposureProgram}
                />
                <InfoRow
                  label={t('exposureMode')}
                  value={exifData.exposureMode}
                />
                <InfoRow
                  label={t('meteringMode')}
                  value={exifData.meteringMode}
                />
                <InfoRow
                  label={t('whiteBalance')}
                  value={exifData.whiteBalance}
                />
                <InfoRow
                  label={t('whiteBalanceBias')}
                  value={
                    exifData.whiteBalanceBias !== undefined
                      ? `${exifData.whiteBalanceBias} Mired`
                      : null
                  }
                />
                <InfoRow label={t('wbShiftAB')} value={exifData.wbShiftAB} />
                <InfoRow label={t('wbShiftGM')} value={exifData.wbShiftGM} />
                <InfoRow label={t('flash')} value={exifData.flash} />
                <InfoRow
                  label={t('lightSource')}
                  value={exifData.lightSource}
                />
                <InfoRow
                  label={t('sceneCaptureType')}
                  value={exifData.sceneCaptureType}
                />
                <InfoRow
                  label={t('flashMeteringMode')}
                  value={exifData.flashMeteringMode}
                />
              </InfoSection>

              <InfoSection title={t('location')}>
                <InfoRow
                  label={t('gpsLatitude')}
                  value={exifData.gps?.latitude}
                />
                <InfoRow
                  label={t('gpsLongitude')}
                  value={exifData.gps?.longitude}
                />
                <InfoRow
                  label={t('gpsAltitude')}
                  value={
                    exifData.gps?.altitude ? `${exifData.gps.altitude}m` : null
                  }
                />
              </InfoSection>

              <InfoSection title={t('technicalParameters')} className="pt-2">
                <InfoRow
                  label={t('brightnessValue')}
                  value={exifData.brightnessValue}
                />
                <InfoRow
                  label={t('shutterSpeedValue')}
                  value={exifData.shutterSpeedValue}
                />
                <InfoRow
                  label={t('apertureValue')}
                  value={exifData.apertureValue}
                />
                <InfoRow
                  label={t('sensingMethod')}
                  value={exifData.sensingMethod}
                />
                <InfoRow
                  label={t('focalPlaneResolution')}
                  value={focalPlaneResolution}
                />
              </InfoSection>
            </>
          ) : null}
        </div>
      </div>

      <div className={`shrink-0 border-t p-3 ${tw.border}`}>
        <button
          type="button"
          onClick={() => store.showPhotoInFolder(photo)}
          className={`w-full rounded-md px-3 py-1.5 text-xs ${tw.text.secondary} ${tw.hover} transition-colors`}
        >
          {t('showInFolder')}
        </button>
      </div>
    </aside>
  )
})

export default PhotoInfoPanel
