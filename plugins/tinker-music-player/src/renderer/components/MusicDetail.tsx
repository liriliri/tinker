import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Music } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { findCurrentLine } from '../lib/lyric'

const MusicDetail = observer(() => {
  const { t } = useTranslation()
  const track = store.currentTrack
  const containerRef = useRef<HTMLDivElement>(null)
  const currentLineIdx = findCurrentLine(store.lyricLines, store.currentTime)
  const [visible, setVisible] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    if (store.showMusicDetail) {
      setVisible(true)
    } else {
      setAnimateIn(false)
    }
  }, [store.showMusicDetail])

  useEffect(() => {
    if (visible && store.showMusicDetail) {
      // Force a reflow before triggering animation so transition plays
      requestAnimationFrame(() => {
        setAnimateIn(true)
      })
    }
  }, [visible])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && store.showMusicDetail) {
        store.hideMusicDetail()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  useEffect(() => {
    if (!containerRef.current || currentLineIdx < 0) return
    const el = document.getElementById(`lyric-line-${currentLineIdx}`)
    if (el) {
      const container = containerRef.current
      const offsetTop =
        el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2
      container.scrollTo({ top: offsetTop, behavior: 'smooth' })
    }
  }, [currentLineIdx])

  if (!visible) return null

  const handleTransitionEnd = () => {
    if (!store.showMusicDetail) {
      setVisible(false)
    }
  }

  return (
    <div
      style={{
        transform: animateIn ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-out',
      }}
      onTransitionEnd={handleTransitionEnd}
      className={`fixed top-0 left-0 right-0 bottom-14 z-50 flex flex-col ${tw.bg.primary}`}
    >
      {/* Background blur */}
      {track?.cover && (
        <div
          className="absolute inset-0 opacity-30 blur-3xl scale-110"
          style={{
            backgroundImage: `url(${track.cover})`,
            backgroundSize: 'cover',
          }}
        />
      )}

      {/* Header */}
      <div className="relative flex items-center px-4 py-2">
        <button
          onClick={() => store.hideMusicDetail()}
          className={`p-2 rounded-full ${tw.hover} ${tw.text.secondary} transition-colors`}
        >
          <ChevronDown size={22} />
        </button>
      </div>

      {/* Body */}
      <div className="relative flex-1 flex items-center justify-center gap-12 px-8 overflow-hidden min-h-0">
        {/* Album art */}
        <div className="flex-shrink-0">
          {track?.cover ? (
            <img
              src={track.cover}
              className="w-64 h-64 rounded-lg object-cover shadow-lg"
            />
          ) : (
            <div
              className={`w-64 h-64 rounded-lg flex items-center justify-center shadow-lg ${tw.bg.tertiary}`}
            >
              <Music size={64} className={tw.text.tertiary} />
            </div>
          )}
          {track && (
            <div className="mt-4 text-center max-w-64">
              <div
                className={`text-lg font-semibold truncate ${tw.text.primary}`}
              >
                {track.title}
              </div>
              <div className={`text-sm mt-1 ${tw.text.tertiary}`}>
                {track.artist || t('unknownArtist')}
                {track.album ? ` - ${track.album}` : ''}
              </div>
            </div>
          )}
        </div>

        {/* Lyrics */}
        <div className="relative w-96 self-stretch">
          <div
            ref={containerRef}
            className="w-full h-full overflow-y-auto scrollbar-hide"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
            }}
          >
            {store.lyricLines.length > 0 ? (
              <div className="py-40">
                {store.lyricLines.map((line, idx) => (
                  <div
                    key={idx}
                    id={`lyric-line-${idx}`}
                    className={`text-center py-2 transition-all duration-300 ${
                      idx === currentLineIdx
                        ? `text-lg font-semibold ${tw.primary.text}`
                        : `text-base opacity-60 ${tw.text.secondary}`
                    }`}
                  >
                    {line.text || '...'}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`h-full flex items-center justify-center text-sm ${tw.text.tertiary}`}
              >
                {t('noLyric')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default MusicDetail
