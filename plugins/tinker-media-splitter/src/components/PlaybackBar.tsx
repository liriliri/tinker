import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
} from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import { formatTimecode } from '../lib/util'

const ICON = 16
const SEEK_STEP = 1

interface ControlButtonProps {
  title: string
  onClick: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

function ControlButton({
  title,
  onClick,
  disabled = false,
  className = '',
  children,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center rounded p-1.5 disabled:opacity-40 ${tw.hover} ${tw.text.primary} ${className}`}
    >
      {children}
    </button>
  )
}

export default observer(function PlaybackBar() {
  const { t } = useTranslation()
  const busy = store.isExporting

  return (
    <div
      className={`shrink-0 border-t px-3 py-1.5 ${tw.border} ${tw.bg.secondary}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-24 shrink-0 text-[11px] tabular-nums ${tw.text.tertiary}`}
        >
          {formatTimecode(store.currentTime)}
        </span>

        <div className="flex flex-1 items-center justify-center gap-0.5">
          <ControlButton
            title={t('jumpStart')}
            disabled={busy}
            onClick={() => store.jumpToStart()}
          >
            <SkipBack size={ICON} />
          </ControlButton>

          <ControlButton
            title={t('jumpSegStart')}
            disabled={busy || !store.activeSegment}
            onClick={() => store.jumpToActiveStart()}
          >
            <StepBack size={ICON} />
          </ControlButton>

          <ControlButton
            title={t('setIn')}
            disabled={busy}
            onClick={() => store.setInPoint()}
          >
            <ArrowLeftToLine size={ICON} />
          </ControlButton>

          <ControlButton
            title={t('seekBack')}
            disabled={busy}
            onClick={() => store.seekRel(-SEEK_STEP)}
          >
            <ChevronLeft size={20} />
          </ControlButton>

          <button
            type="button"
            title={t('playPause')}
            disabled={busy}
            onClick={() => store.togglePlay()}
            className={`mx-1 flex h-8 w-8 items-center justify-center rounded-full text-white disabled:opacity-40 ${tw.primary.bg} ${tw.primary.bgHover}`}
          >
            {store.playing ? (
              <Pause size={14} />
            ) : (
              <Play size={14} className="ml-0.5" />
            )}
          </button>

          <ControlButton
            title={t('seekForward')}
            disabled={busy}
            onClick={() => store.seekRel(SEEK_STEP)}
          >
            <ChevronRight size={20} />
          </ControlButton>

          <ControlButton
            title={t('setOut')}
            disabled={busy}
            onClick={() => store.setOutPoint()}
          >
            <ArrowRightToLine size={ICON} />
          </ControlButton>

          <ControlButton
            title={t('jumpSegEnd')}
            disabled={busy || !store.activeSegment}
            onClick={() => store.jumpToActiveEnd()}
          >
            <StepForward size={ICON} />
          </ControlButton>

          <ControlButton
            title={t('jumpEnd')}
            disabled={busy}
            onClick={() => store.jumpToEnd()}
          >
            <SkipForward size={ICON} />
          </ControlButton>
        </div>

        <span
          className={`w-24 shrink-0 text-right text-[11px] tabular-nums ${tw.text.tertiary}`}
        >
          {formatTimecode(store.duration)}
        </span>
      </div>
    </div>
  )
})
