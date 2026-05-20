import { observer } from 'mobx-react-lite'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat1,
  Repeat2,
  ListMusic,
  Music,
  Heart,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { PlayMode } from '../types'
import { mediaDurationFormat } from 'share/lib/util'
import { ProgressBar, VolumeBar } from './ProgressBar'

const PLAY_MODE_ICONS: Record<PlayMode, typeof Repeat1> = {
  sequence: Repeat2,
  loop: Repeat1,
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
  const handleCoverClick = () => {
    if (store.showMusicDetail) {
      store.hideMusicDetail()
    } else {
      store.showMusicDetailView()
    }
  }

  const CoverIcon = store.showMusicDetail ? Minimize2 : Maximize2
  const isFav = track ? store.isTrackInFavorite(track.id) : false

  return (
    <div className={`relative z-[60] ${tw.bg.secondary}`}>
      {/* Progress bar at top like a border */}
      <div className="absolute -top-1.5 left-0 right-0">
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
                <div
                  onClick={handleCoverClick}
                  className="relative w-10 h-10 flex-shrink-0 cursor-default group"
                >
                  <img
                    src={track.cover}
                    className="w-10 h-10 rounded-md object-cover shadow-sm"
                  />
                  <div className="absolute inset-0 rounded-md bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CoverIcon size={14} className="text-white" />
                  </div>
                </div>
              ) : (
                <div
                  onClick={handleCoverClick}
                  className={`relative w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 cursor-default group ${tw.bg.tertiary}`}
                >
                  <Music
                    size={16}
                    className={`${tw.text.tertiary} group-hover:opacity-0 transition-opacity`}
                  />
                  <div className="absolute inset-0 rounded-md bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CoverIcon size={14} className="text-white" />
                  </div>
                </div>
              )}
              <div className="min-w-0 w-24 flex-shrink-0">
                <div
                  className={`text-sm font-medium truncate ${tw.text.primary}`}
                >
                  {track.title}
                </div>
                <div className={`text-xs ${tw.text.tertiary} truncate`}>
                  {track.artist || t('unknownArtist')}
                </div>
              </div>
              <span
                className={`text-xs flex-shrink-0 tabular-nums ${tw.text.tertiary}`}
              >
                {mediaDurationFormat(store.currentTime)}
                <span className="opacity-50"> / </span>
                {mediaDurationFormat(store.duration)}
              </span>
              <button
                onClick={() => store.toggleFavorite(track.id)}
                className={`p-1.5 rounded-full flex-shrink-0 ${
                  tw.hover
                } transition-colors ${
                  isFav ? 'text-red-500' : tw.text.tertiary
                }`}
              >
                <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
              </button>
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
            className={`p-1.5 rounded-full cursor-default ${tw.hover} ${tw.text.secondary} transition-colors`}
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={() => store.togglePlay()}
            className={`p-2.5 rounded-full cursor-default ${tw.primary.bg} text-white hover:opacity-90 transition-opacity shadow-sm`}
          >
            {store.isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
          </button>
          <button
            onClick={() => store.playNext()}
            className={`p-1.5 rounded-full cursor-default ${tw.hover} ${tw.text.secondary} transition-colors`}
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
