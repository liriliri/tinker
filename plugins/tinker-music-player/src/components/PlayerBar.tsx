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
  ListMusic,
  Music,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { PlayMode } from '../types'
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
    <div className={`relative ${tw.bg.secondary}`}>
      {/* Progress bar at top like a border */}
      <div className="absolute -top-1.5 left-0 right-0 z-10">
        <ProgressBar
          value={store.currentTime}
          max={store.duration}
          onChange={(v) => store.seek(v)}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center px-4 h-14">
        {/* Track info - left */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {track ? (
            <>
              {track.cover ? (
                <img
                  src={track.cover}
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0 shadow-sm"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${tw.bg.secondary}`}
                >
                  <Music size={16} className={tw.text.tertiary} />
                </div>
              )}
              <div className="min-w-0">
                <div
                  className={`text-sm font-medium truncate ${tw.text.primary}`}
                >
                  {track.title}
                </div>
                <div className={`text-xs ${tw.text.tertiary} truncate`}>
                  {track.artist || t('unknownArtist')}
                  <span className="mx-1.5 opacity-50">·</span>
                  {formatTime(store.currentTime)}
                  <span className="opacity-50"> / </span>
                  {formatTime(store.duration)}
                </div>
              </div>
            </>
          ) : (
            <span className={`text-sm ${tw.text.tertiary}`}>
              {t('noTrack')}
            </span>
          )}
        </div>

        {/* Playback controls - center */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => store.playPrev()}
            className={`p-1.5 rounded-full ${tw.hover} ${tw.text.secondary} transition-colors`}
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={() => store.togglePlay()}
            className={`p-2.5 rounded-full ${tw.primary.bg} text-white hover:opacity-90 transition-opacity shadow-sm`}
          >
            {store.isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
          </button>
          <button
            onClick={() => store.playNext()}
            className={`p-1.5 rounded-full ${tw.hover} ${tw.text.secondary} transition-colors`}
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Right controls */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <button
            onClick={() => store.cyclePlayMode()}
            className={`p-1.5 rounded-full ${tw.hover} ${
              store.playMode === 'sequence' ? tw.text.tertiary : tw.primary.text
            } transition-colors`}
            title={t(PLAY_MODE_LABELS[store.playMode])}
          >
            <ModeIcon size={15} />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => store.setVolume(store.volume > 0 ? 0 : 0.8)}
              className={`p-1.5 rounded-full ${tw.hover} ${tw.text.secondary} transition-colors`}
            >
              {store.volume > 0 ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <VolumeBar
              value={store.volume}
              onChange={(v) => store.setVolume(v)}
            />
          </div>

          <button
            onClick={() => store.togglePlayQueue()}
            className={`p-1.5 rounded-full ${tw.hover} ${
              store.showPlayQueue ? tw.primary.text : tw.text.secondary
            } transition-colors`}
            title={t('playQueue')}
          >
            <ListMusic size={15} />
          </button>
        </div>
      </div>
    </div>
  )
})

export default PlayerBar
