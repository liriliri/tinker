import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import fileSize from 'licia/fileSize'
import Dialog from 'share/components/Dialog'
import { tw } from 'share/theme'
import store from '../store'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatBitrate(bitrate: number): string {
  if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(2)} Mbps`
  }
  return `${Math.round(bitrate)} Kbps`
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between py-1.5">
      <span className={tw.text.secondary}>{label}</span>
      <span className={tw.text.primary}>{value}</span>
    </div>
  )
}

export default observer(function MediaInfoDialog() {
  const { t } = useTranslation()
  const { mediaInfo } = store

  return (
    <Dialog
      open={store.showMediaInfo}
      onClose={() => store.closeMediaInfo()}
      title={t('fileInfo')}
      showClose
    >
      {mediaInfo && (
        <div className={`text-sm divide-y ${tw.divide}`}>
          <div className="pb-2">
            <InfoRow label={t('size')} value={fileSize(mediaInfo.size)} />
            <InfoRow
              label={t('duration')}
              value={formatDuration(mediaInfo.duration)}
            />
          </div>
          {mediaInfo.videoStream && (
            <div className="py-2">
              <h4 className={`text-sm font-semibold ${tw.primary.text} mb-1`}>
                {t('video')}
              </h4>
              <InfoRow label={t('codec')} value={mediaInfo.videoStream.codec} />
              <InfoRow
                label={t('resolution')}
                value={`${mediaInfo.videoStream.width}×${mediaInfo.videoStream.height}`}
              />
              <InfoRow
                label={t('fps')}
                value={String(mediaInfo.videoStream.fps)}
              />
              {mediaInfo.videoStream.bitrate != null && (
                <InfoRow
                  label={t('bitrate')}
                  value={formatBitrate(mediaInfo.videoStream.bitrate)}
                />
              )}
            </div>
          )}
          {mediaInfo.audioStream && (
            <div className="pt-2">
              <h4 className={`text-sm font-semibold ${tw.primary.text} mb-1`}>
                {t('audio')}
              </h4>
              <InfoRow label={t('codec')} value={mediaInfo.audioStream.codec} />
              {mediaInfo.audioStream.sampleRate != null && (
                <InfoRow
                  label={t('sampleRate')}
                  value={`${mediaInfo.audioStream.sampleRate} Hz`}
                />
              )}
              {mediaInfo.audioStream.bitrate != null && (
                <InfoRow
                  label={t('bitrate')}
                  value={formatBitrate(mediaInfo.audioStream.bitrate)}
                />
              )}
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
})
