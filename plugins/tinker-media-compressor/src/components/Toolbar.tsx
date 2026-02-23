import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, ListX, Folder, X, Video, Music } from 'lucide-react'
import Select from 'share/components/Select'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarTextButton,
  ToolbarLabel,
  ToolbarButtonGroup,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'
import type { VideoCompressionMode, AudioCompressionMode } from '../types'

const VIDEO_COMPRESSION_MODES: Array<{
  label: string
  value: VideoCompressionMode
}> = [
  { label: 'videoCrf', value: 'crf' },
  { label: 'videoBitrate', value: 'bitrate' },
  { label: 'videoResolution', value: 'resolution' },
]

const AUDIO_COMPRESSION_MODES: Array<{
  label: string
  value: AudioCompressionMode
}> = [
  { label: 'audioBitrate', value: 'bitrate' },
  { label: 'audioSamplerate', value: 'samplerate' },
]

const CRF_LEVELS = [
  { label: 'crf35', value: 0 },
  { label: 'crf28', value: 1 },
  { label: 'crf23', value: 2 },
  { label: 'crf18', value: 3 },
  { label: 'crf15', value: 4 },
]

const PERCENTAGE_LEVELS = [
  { label: 'percentage30', value: 0 },
  { label: 'percentage50', value: 1 },
  { label: 'percentage70', value: 2 },
  { label: 'percentage85', value: 3 },
  { label: 'percentage95', value: 4 },
]

const AUDIO_BITRATE_LEVELS = [
  { label: 'bitrate64k', value: 0 },
  { label: 'bitrate96k', value: 1 },
  { label: 'bitrate128k', value: 2 },
  { label: 'bitrate192k', value: 3 },
  { label: 'bitrate320k', value: 4 },
]

const AUDIO_SAMPLERATE_LEVELS = [
  { label: 'samplerate22050', value: 0 },
  { label: 'samplerate32000', value: 1 },
  { label: 'samplerate44100', value: 2 },
  { label: 'samplerate48000', value: 3 },
  { label: 'samplerate96000', value: 4 },
]

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const videoModeOptions = VIDEO_COMPRESSION_MODES.map((mode) => ({
    label: t(mode.label),
    value: mode.value,
  }))

  const audioModeOptions = AUDIO_COMPRESSION_MODES.map((mode) => ({
    label: t(mode.label),
    value: mode.value,
  }))

  const getQualityOptions = () => {
    if (store.mode === 'video') {
      if (store.videoCompressionMode === 'crf') {
        return CRF_LEVELS.map((level) => ({
          label: t(level.label),
          value: level.value,
        }))
      }
      return PERCENTAGE_LEVELS.map((level) => ({
        label: t(level.label),
        value: level.value,
      }))
    } else {
      if (store.audioCompressionMode === 'bitrate') {
        return AUDIO_BITRATE_LEVELS.map((level) => ({
          label: t(level.label),
          value: level.value,
        }))
      }
      return AUDIO_SAMPLERATE_LEVELS.map((level) => ({
        label: t(level.label),
        value: level.value,
      }))
    }
  }

  const qualityOptions = getQualityOptions()

  return (
    <Toolbar>
      <ToolbarButtonGroup>
        <ToolbarButton
          variant="toggle"
          active={store.mode === 'video'}
          onClick={() => store.setMode('video')}
          title={t('video')}
          className={`rounded-none rounded-l border-r ${tw.border}`}
        >
          <Video size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          variant="toggle"
          active={store.mode === 'audio'}
          onClick={() => store.setMode('audio')}
          title={t('audio')}
          className="rounded-none rounded-r"
        >
          <Music size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </ToolbarButtonGroup>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.openMediaDialog()}
        title={t('openFile')}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.clear()}
        disabled={!store.hasItems}
        title={t('clear')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Output directory */}
      <div
        className="flex items-center w-52 px-1 py-1 text-xs rounded border border-[#e0e0e0] dark:border-[#4a4a4a] bg-white dark:bg-[#2d2d2d] focus-within:ring-1 focus-within:ring-[#0fc25e]"
        title={store.outputDir || t('outputDirPlaceholder')}
      >
        <button
          onClick={() => store.browseOutputDir()}
          title={t('browseOutputDir')}
          className="flex items-center justify-center px-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 shrink-0"
        >
          <Folder size={TOOLBAR_ICON_SIZE} />
        </button>
        <input
          type="text"
          value={store.outputDir}
          onChange={(e) => store.setOutputDir(e.target.value)}
          placeholder={t('outputDirPlaceholder')}
          className="flex-1 min-w-0 mx-1 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        {store.outputDir && (
          <button
            onClick={() => store.setOutputDir('')}
            title={t('clearOutputDir')}
            className="flex items-center justify-center px-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 shrink-0"
          >
            <X size={TOOLBAR_ICON_SIZE} />
          </button>
        )}
      </div>

      <ToolbarSpacer />

      {store.hasItems && (
        <>
          <div className="flex gap-2 items-center">
            <ToolbarLabel>{`${t('compressionMode')}:`}</ToolbarLabel>
            {store.mode === 'video' ? (
              <Select<VideoCompressionMode>
                value={store.videoCompressionMode}
                onChange={(v) => store.setVideoCompressionMode(v)}
                options={videoModeOptions}
                disabled={store.isCompressing}
              />
            ) : (
              <Select<AudioCompressionMode>
                value={store.audioCompressionMode}
                onChange={(v) => store.setAudioCompressionMode(v)}
                options={audioModeOptions}
                disabled={store.isCompressing}
              />
            )}
          </div>

          <ToolbarSeparator />

          <Select
            value={store.quality}
            onChange={(v) => store.setQuality(v)}
            options={qualityOptions}
            disabled={store.isCompressing}
            className="w-24"
          />

          <ToolbarSeparator />

          <ToolbarTextButton
            onClick={() => store.compressAll()}
            disabled={store.isCompressing || !store.hasUncompressed}
          >
            {t('compress')}
          </ToolbarTextButton>
        </>
      )}
    </Toolbar>
  )
})
