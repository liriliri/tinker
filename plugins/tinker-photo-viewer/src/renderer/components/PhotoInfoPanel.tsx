import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Circle, Clock, Sun } from 'lucide-react'
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

interface InfoRowProps {
  label: string
  value: string
  ellipsis?: boolean
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h4 className={`mb-2 text-sm font-medium ${tw.text.primary}`}>
      {children}
    </h4>
  )
}

function InfoRow({ label, value, ellipsis = false }: InfoRowProps) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className={`shrink-0 ${tw.text.secondary}`}>{label}</span>
      {ellipsis ? (
        <span
          className={`min-w-0 flex-1 truncate text-right ${tw.text.primary}`}
          title={value}
        >
          {value}
        </span>
      ) : (
        <span className={`min-w-0 text-right ${tw.text.primary}`}>{value}</span>
      )}
    </div>
  )
}

interface ExifChipProps {
  icon: ReactNode
  value: string
}

function ExifChip({ icon, value }: ExifChipProps) {
  return (
    <div
      className={`flex h-6 items-center gap-2 rounded-md border px-2 ${tw.border} ${tw.bg.secondary}`}
    >
      <span className={tw.text.tertiary}>{icon}</span>
      <span className={`text-xs ${tw.text.primary}`}>{value}</span>
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

  const hasCaptureParams = Boolean(
    exifData?.shutterSpeed ||
      exifData?.iso ||
      exifData?.aperture ||
      exifData?.exposureBias ||
      exifData?.focalLength35mm
  )

  const hasDeviceInfo = Boolean(exifData?.camera || exifData?.lens)

  const hasCaptureMode = Boolean(
    exifData?.exposureMode ||
      exifData?.exposureProgram ||
      exifData?.meteringMode ||
      exifData?.whiteBalance ||
      exifData?.lightSource ||
      exifData?.flash
  )

  const hasTechnicalParams = Boolean(
    exifData?.brightnessValue ||
      exifData?.shutterSpeedValue ||
      exifData?.apertureValue ||
      exifData?.sensingMethod ||
      exifData?.focalPlaneXResolution ||
      exifData?.focalPlaneYResolution
  )

  return (
    <aside
      className={`flex h-full w-80 shrink-0 flex-col border-l ${tw.border} ${tw.bg.tertiary}`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          <section>
            <SectionTitle>{t('basicInfo')}</SectionTitle>
            <div className="space-y-1">
              <InfoRow label={t('fileName')} value={photo.title} ellipsis />
              <InfoRow label={t('format')} value={photo.format} />
              {photo.width > 0 && photo.height > 0 ? (
                <InfoRow
                  label={t('dimensions')}
                  value={`${photo.width} × ${photo.height}`}
                />
              ) : null}
              <InfoRow
                label={t('fileSize')}
                value={formatFileSizeMb(photo.size)}
              />
              {megapixels ? (
                <InfoRow label={t('megapixels')} value={megapixels} />
              ) : null}
              <InfoRow label={t('dateTaken')} value={dateTakenLabel} />
              {exifData?.colorSpace ? (
                <InfoRow label={t('colorSpace')} value={exifData.colorSpace} />
              ) : null}
              {exifData?.rating && exifData.rating > 0 ? (
                <InfoRow
                  label={t('rating')}
                  value={'★'.repeat(exifData.rating)}
                />
              ) : null}
              {exifData?.zone ? (
                <InfoRow label={t('timeZone')} value={exifData.zone} />
              ) : null}
              {exifData?.artist ? (
                <InfoRow label={t('artist')} value={exifData.artist} />
              ) : null}
              {exifData?.copyright ? (
                <InfoRow label={t('copyright')} value={exifData.copyright} />
              ) : null}
              {exifData?.software ? (
                <InfoRow label={t('software')} value={exifData.software} />
              ) : null}
            </div>

            {hasCaptureParams && exifData ? (
              <div className="mt-3">
                <SectionTitle>{t('captureParameters')}</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  {exifData.focalLength35mm ? (
                    <ExifChip
                      icon={<Camera size={14} />}
                      value={`${exifData.focalLength35mm}mm`}
                    />
                  ) : null}
                  {exifData.aperture ? (
                    <ExifChip
                      icon={<Circle size={14} />}
                      value={exifData.aperture}
                    />
                  ) : null}
                  {exifData.shutterSpeed ? (
                    <ExifChip
                      icon={<Clock size={14} />}
                      value={exifData.shutterSpeed}
                    />
                  ) : null}
                  {exifData.iso ? (
                    <ExifChip
                      icon={<span className="text-[10px]">ISO</span>}
                      value={String(exifData.iso)}
                    />
                  ) : null}
                  {exifData.exposureBias ? (
                    <ExifChip
                      icon={<Sun size={14} />}
                      value={exifData.exposureBias}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          {hasDeviceInfo && exifData ? (
            <section>
              <SectionTitle>{t('deviceInfo')}</SectionTitle>
              <div className="space-y-1">
                {exifData.camera ? (
                  <InfoRow label={t('camera')} value={exifData.camera} />
                ) : null}
                {exifData.lens ? (
                  <InfoRow label={t('lens')} value={exifData.lens} />
                ) : null}
                {exifData.lensMake &&
                exifData.lens &&
                !exifData.lens.includes(exifData.lensMake) ? (
                  <InfoRow label={t('lensMake')} value={exifData.lensMake} />
                ) : null}
                {exifData.focalLength ? (
                  <InfoRow
                    label={t('focalLengthActual')}
                    value={`${exifData.focalLength}mm`}
                  />
                ) : null}
                {exifData.focalLength35mm ? (
                  <InfoRow
                    label={t('focalLengthEquivalent')}
                    value={`${exifData.focalLength35mm}mm`}
                  />
                ) : null}
                {exifData.maxAperture ? (
                  <InfoRow
                    label={t('maxAperture')}
                    value={`f/${exifData.maxAperture}`}
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {hasCaptureMode && exifData ? (
            <section>
              <SectionTitle>{t('captureMode')}</SectionTitle>
              <div className="space-y-1">
                {exifData.exposureProgram ? (
                  <InfoRow
                    label={t('exposureProgram')}
                    value={exifData.exposureProgram}
                  />
                ) : null}
                {exifData.exposureMode ? (
                  <InfoRow
                    label={t('exposureMode')}
                    value={exifData.exposureMode}
                  />
                ) : null}
                {exifData.meteringMode ? (
                  <InfoRow
                    label={t('meteringMode')}
                    value={exifData.meteringMode}
                  />
                ) : null}
                {exifData.whiteBalance ? (
                  <InfoRow
                    label={t('whiteBalance')}
                    value={exifData.whiteBalance}
                  />
                ) : null}
                {exifData.whiteBalanceBias !== undefined ? (
                  <InfoRow
                    label={t('whiteBalanceBias')}
                    value={`${exifData.whiteBalanceBias} Mired`}
                  />
                ) : null}
                {exifData.wbShiftAB ? (
                  <InfoRow label={t('wbShiftAB')} value={exifData.wbShiftAB} />
                ) : null}
                {exifData.wbShiftGM ? (
                  <InfoRow label={t('wbShiftGM')} value={exifData.wbShiftGM} />
                ) : null}
                {exifData.flash ? (
                  <InfoRow label={t('flash')} value={exifData.flash} />
                ) : null}
                {exifData.lightSource ? (
                  <InfoRow
                    label={t('lightSource')}
                    value={exifData.lightSource}
                  />
                ) : null}
                {exifData.sceneCaptureType ? (
                  <InfoRow
                    label={t('sceneCaptureType')}
                    value={exifData.sceneCaptureType}
                  />
                ) : null}
                {exifData.flashMeteringMode ? (
                  <InfoRow
                    label={t('flashMeteringMode')}
                    value={exifData.flashMeteringMode}
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {exifData?.gps ? (
            <section>
              <SectionTitle>{t('location')}</SectionTitle>
              <div className="space-y-1">
                <InfoRow
                  label={t('gpsLatitude')}
                  value={exifData.gps.latitude}
                />
                <InfoRow
                  label={t('gpsLongitude')}
                  value={exifData.gps.longitude}
                />
                {exifData.gps.altitude ? (
                  <InfoRow
                    label={t('gpsAltitude')}
                    value={`${exifData.gps.altitude}m`}
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {hasTechnicalParams && exifData ? (
            <section>
              <SectionTitle>{t('technicalParameters')}</SectionTitle>
              <div className="space-y-1">
                {exifData.brightnessValue ? (
                  <InfoRow
                    label={t('brightnessValue')}
                    value={exifData.brightnessValue}
                  />
                ) : null}
                {exifData.shutterSpeedValue !== undefined ? (
                  <InfoRow
                    label={t('shutterSpeedValue')}
                    value={String(exifData.shutterSpeedValue)}
                  />
                ) : null}
                {exifData.apertureValue ? (
                  <InfoRow
                    label={t('apertureValue')}
                    value={exifData.apertureValue}
                  />
                ) : null}
                {exifData.sensingMethod ? (
                  <InfoRow
                    label={t('sensingMethod')}
                    value={exifData.sensingMethod}
                  />
                ) : null}
                {exifData.focalPlaneXResolution ||
                exifData.focalPlaneYResolution ? (
                  <InfoRow
                    label={t('focalPlaneResolution')}
                    value={`${
                      exifData.focalPlaneXResolution ?? t('notAvailable')
                    } × ${exifData.focalPlaneYResolution ?? t('notAvailable')}`}
                  />
                ) : null}
              </div>
            </section>
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
