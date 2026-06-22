import { observer } from 'mobx-react-lite'
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import dateFormat from 'licia/dateFormat'
import {
  Camera,
  Circle,
  Clock,
  FolderOpen,
  PanelRightClose,
} from 'lucide-react'
import {
  formatExifData,
  formatFileSize,
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
  return <h4 className="mb-2 text-sm font-medium text-white/80">{children}</h4>
}

function InfoRow({ label, value, ellipsis = false }: InfoRowProps) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="shrink-0 text-white/60">{label}</span>
      {ellipsis ? (
        <span
          className="min-w-0 flex-1 truncate text-right text-white"
          title={value}
        >
          {value}
        </span>
      ) : (
        <span className="min-w-0 text-right text-white">{value}</span>
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
    <div className="flex h-6 items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2">
      <span className="text-white/70">{icon}</span>
      <span className="text-xs text-white">{value}</span>
    </div>
  )
}

const PhotoInfoPanel = observer(function PhotoInfoPanel({
  photo,
}: PhotoInfoPanelProps) {
  const { t } = useTranslation()
  const exifData = formatExifData(photo.exif)
  const megapixels = useMemo(() => {
    if (photo.width <= 0 || photo.height <= 0) return null
    return formatMegapixels(photo.width, photo.height)
  }, [photo.width, photo.height])

  const hasCaptureParams = Boolean(
    exifData?.focalLength ||
      exifData?.aperture ||
      exifData?.shutterSpeed ||
      exifData?.iso
  )

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-white/10 bg-black/40 text-white backdrop-blur-xl">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold">{t('photoInfo')}</h3>
        <button
          type="button"
          onClick={() => store.toggleInfoPanel()}
          className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          title={t('toggleInfoPanel')}
        >
          <PanelRightClose size={16} />
        </button>
      </div>

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
                value={formatFileSize(photo.size)}
              />
              {megapixels ? (
                <InfoRow label={t('megapixels')} value={megapixels} />
              ) : null}
              <InfoRow
                label={t('dateTaken')}
                value={dateFormat(
                  new Date(photo.createdAt),
                  'yyyy-mm-dd HH:MM:ss'
                )}
              />
              <InfoRow label={t('path')} value={photo.path} ellipsis />
            </div>
          </section>

          {hasCaptureParams && exifData ? (
            <section>
              <SectionTitle>{t('captureParameters')}</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {exifData.focalLength ? (
                  <ExifChip
                    icon={<Camera size={14} />}
                    value={exifData.focalLength}
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
                    value={exifData.iso}
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {exifData?.camera ? (
            <section>
              <SectionTitle>{t('deviceInfo')}</SectionTitle>
              <div className="space-y-1">
                <InfoRow label={t('camera')} value={exifData.camera} />
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 p-4">
        <button
          type="button"
          onClick={() => store.showPhotoInFolder(photo)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/15"
        >
          <FolderOpen size={14} />
          {t('showInFolder')}
        </button>
      </div>
    </aside>
  )
})

export default PhotoInfoPanel
