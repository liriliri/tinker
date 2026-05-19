import { observer } from 'mobx-react-lite'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat2,
  List,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store, { PlayMode } from '../store'
import { formatTime } from '../lib/util'
import { ProgressBar, VolumeBar } from './ProgressBar'

const PLAY_MODE_ICONS: Record<PlayMode, typeof List> = {
  sequence: List,
  loop: Repeat2,
  shuffle: Shuffle,
}

const PLAY_MODE_LABELS: Record<PlayMode, string> = {
  sequence: 'modeSequence',
  loop: 'modeLoop',
  shuffle: 'modeShuffle',
}

const PlayerBar = observer(() => {
  const { t } = useTranslation()
  const track = store.currentTrack
  const ModeIcon = PLAY_MODE_ICONS[store.playMode]

  return (
    <div className={`border-t ${tw.border} ${tw.bg.primary} px-4 py-2`}>
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs ${tw.text.tertiary} w-10 text-right`}>
          {formatTime(store.currentTime)}
        </span>
        <div className="flex-1">
          <ProgressBar
            value={store.currentTime}
            max={store.duration}
            onChange={(v) => store.seek(v)}
          />
        </div>
        <span className={`text-xs ${tw.text.tertiary} w-10`}>
          {formatTime(store.duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center">
        {/* Track info */}
        <div className="flex-1 min-w-0">
          {track ? (
            <div className="truncate">
              <span className={`text-sm ${tw.text.primary}`}>
                {track.title}
              </span>
              <span className={`text-xs ${tw.text.tertiary} ml-2`}>
                {track.artist}
              </span>
            </div>
          ) : (
            <span className={`text-sm ${tw.text.tertiary}`}>
              {t('noTrack')}
            </span>
          )}
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => store.playPrev()}
            className={`p-1 rounded ${tw.hover} ${tw.text.secondary}`}
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={() => store.togglePlay()}
            className={`p-2 rounded-full ${tw.primary.bg} text-white hover:opacity-90`}
          >
            {store.isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={() => store.playNext()}
            className={`p-1 rounded ${tw.hover} ${tw.text.secondary}`}
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Right controls */}
        <div className="flex-1 flex items-center justify-end gap-2">
          {/* Play mode */}
          <button
            onClick={() => store.cyclePlayMode()}
            className={`p-1 rounded ${tw.hover} ${
              store.playMode === 'sequence' ? tw.text.tertiary : tw.primary.text
            }`}
            title={t(PLAY_MODE_LABELS[store.playMode])}
          >
            <ModeIcon size={14} />
          </button>

          {/* Volume */}
          <button
            onClick={() => store.setVolume(store.volume > 0 ? 0 : 0.8)}
            className={`p-1 rounded ${tw.hover} ${tw.text.secondary}`}
          >
            {store.volume > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <VolumeBar
            value={store.volume}
            onChange={(v) => store.setVolume(v)}
          />
        </div>
      </div>
    </div>
  )
})

export default PlayerBar
