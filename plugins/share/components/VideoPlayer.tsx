import { forwardRef, PropsWithChildren } from 'react'
import {
  Container,
  usePlayer,
  BufferingIndicator,
  PlayButton,
  SeekButton,
  PlaybackRateButton,
  CaptionsButton,
  MuteButton,
  PiPButton,
  FullscreenButton,
  Tooltip,
  Popover,
  Poster,
  Controls,
  AlertDialog,
  ErrorDialog,
  Slider,
  Time,
  TimeSlider,
  VolumeSlider,
} from '@videojs/react'
import type { PlayButtonProps } from '@videojs/react'
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Subtitles,
  PictureInPicture2,
  Loader2,
  ListVideo,
} from 'lucide-react'

const BUILT_IN_TRANSLATIONS: Record<string, Record<string, string>> = {
  'en-US': {
    play: 'Play',
    pause: 'Pause',
    replay: 'Replay',
    mute: 'Mute',
    unmute: 'Unmute',
    seekBackward: 'Seek backward {{seconds}} seconds',
    seekForward: 'Seek forward {{seconds}} seconds',
    togglePlaybackRate: 'Toggle playback rate',
    enableCaptions: 'Enable captions',
    disableCaptions: 'Disable captions',
    enterPip: 'Enter picture-in-picture',
    exitPip: 'Exit picture-in-picture',
    enterFullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    errorTitle: 'Something went wrong.',
    ok: 'OK',
    playlist: 'Playlist',
  },
  'zh-CN': {
    play: '播放',
    pause: '暂停',
    replay: '重播',
    mute: '静音',
    unmute: '取消静音',
    seekBackward: '后退 {{seconds}} 秒',
    seekForward: '前进 {{seconds}} 秒',
    togglePlaybackRate: '切换播放速度',
    enableCaptions: '开启字幕',
    disableCaptions: '关闭字幕',
    enterPip: '进入画中画',
    exitPip: '退出画中画',
    enterFullscreen: '进入全屏',
    exitFullscreen: '退出全屏',
    errorTitle: '出了点问题。',
    ok: '确定',
    playlist: '播放列表',
  },
}

function createT(locale: string) {
  const translations =
    BUILT_IN_TRANSLATIONS[locale] || BUILT_IN_TRANSLATIONS['en-US']
  return (key: string, params?: Record<string, string | number>) => {
    let text = translations[key] || key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{{${k}}}`, String(v))
      }
    }
    return text
  }
}

const SEEK_TIME = 10
const ICON_SIZE = 18

const THEME_STYLES = `
.media-default-skin {
  border-radius: 0;
  --media-color-primary: #1f2937;
  --media-surface-background-color: rgba(240, 241, 242, 0.85);
  --media-surface-inner-border-color: rgba(224, 224, 224, 0.5);
  --media-surface-outer-border-color: rgba(224, 224, 224, 0.3);
  --media-surface-shadow-color: rgba(0, 0, 0, 0.08);
  --media-border-color: rgba(224, 224, 224, 0.5);
}
.media-default-skin .media-slider__fill {
  color: #0fc25e;
}
.dark .media-default-skin {
  --media-color-primary: #e5e7eb;
  --media-surface-background-color: rgba(48, 49, 51, 0.85);
  --media-surface-inner-border-color: rgba(74, 74, 74, 0.5);
  --media-surface-outer-border-color: rgba(74, 74, 74, 0.3);
  --media-surface-shadow-color: rgba(0, 0, 0, 0.3);
  --media-border-color: rgba(74, 74, 74, 0.5);
}
`

let styleInjected = false
function injectStyles() {
  if (styleInjected) return
  styleInjected = true
  const style = document.createElement('style')
  style.textContent = THEME_STYLES
  document.head.appendChild(style)
}

export interface VideoPlayerProps extends PropsWithChildren {
  className?: string
  poster?: string
  locale?: string
  disabled?: boolean
  onTogglePlaylist?: () => void
}

const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function Button({ className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`media-button media-button--subtle media-button--icon ${
        className || ''
      }`}
      {...props}
    />
  )
})

function VolumePopover({ t }: { t: (key: string) => string }) {
  const volumeUnsupported = usePlayer(
    (s) => s.volumeAvailability === 'unsupported'
  )
  const muteLabel = (state: { muted: boolean }) =>
    state.muted ? t('unmute') : t('mute')
  const muteButton = (
    <MuteButton
      className="media-button--mute"
      render={<Button />}
      label={muteLabel}
    >
      <VolumeX className="media-icon media-icon--volume-off" size={ICON_SIZE} />
      <Volume1 className="media-icon media-icon--volume-low" size={ICON_SIZE} />
      <Volume2
        className="media-icon media-icon--volume-high"
        size={ICON_SIZE}
      />
    </MuteButton>
  )

  if (volumeUnsupported) return muteButton

  return (
    <Popover.Root openOnHover delay={200} closeDelay={100} side="top">
      <Popover.Trigger render={muteButton} />
      <Popover.Popup className="media-surface media-popover media-popover--volume">
        <VolumeSlider.Root
          className="media-slider"
          orientation="vertical"
          thumbAlignment="edge"
        >
          <Slider.Track className="media-slider__track">
            <Slider.Fill className="media-slider__fill" />
          </Slider.Track>
          <Slider.Thumb className="media-slider__thumb media-slider__thumb--persistent" />
        </VolumeSlider.Root>
      </Popover.Popup>
    </Popover.Root>
  )
}

export default function VideoPlayer(props: VideoPlayerProps) {
  const {
    children,
    className,
    poster,
    locale = 'en-US',
    disabled = false,
    onTogglePlaylist,
    ...rest
  } = props

  injectStyles()

  const t = createT(locale)
  const disabledClass = disabled ? 'opacity-30 pointer-events-none' : ''

  const playLabel: PlayButtonProps['label'] = (state) => {
    if (state.ended) return t('replay')
    return state.paused ? t('play') : t('pause')
  }

  return (
    <Container
      className={`media-default-skin media-default-skin--video ${
        className || ''
      }`}
      {...rest}
    >
      {children}
      {poster && <Poster src={poster} />}
      <BufferingIndicator
        render={(p) => (
          <div {...p} className="media-buffering-indicator">
            <div className="media-surface">
              <Loader2 className="media-icon animate-spin" size={24} />
            </div>
          </div>
        )}
      />
      <ErrorDialog.Root>
        <AlertDialog.Popup className="media-error">
          <div className="media-error__dialog media-surface">
            <div className="media-error__content">
              <AlertDialog.Title className="media-error__title">
                {t('errorTitle')}
              </AlertDialog.Title>
              <ErrorDialog.Description className="media-error__description" />
            </div>
            <div className="media-error__actions">
              <AlertDialog.Close className="media-button media-button--primary">
                {t('ok')}
              </AlertDialog.Close>
            </div>
          </div>
        </AlertDialog.Popup>
      </ErrorDialog.Root>
      <Controls.Root className="media-surface media-controls">
        <Tooltip.Provider>
          <div className={`media-button-group ${disabledClass}`}>
            <Tooltip.Root side="top">
              <Tooltip.Trigger
                render={
                  <PlayButton
                    className="media-button--play"
                    render={<Button />}
                    label={playLabel}
                  >
                    <RotateCcw
                      className="media-icon media-icon--restart"
                      size={ICON_SIZE}
                    />
                    <Play
                      className="media-icon media-icon--play"
                      size={ICON_SIZE}
                    />
                    <Pause
                      className="media-icon media-icon--pause"
                      size={ICON_SIZE}
                    />
                  </PlayButton>
                }
              />
              <Tooltip.Popup className="media-surface media-tooltip" />
            </Tooltip.Root>
            <Tooltip.Root side="top">
              <Tooltip.Trigger
                render={
                  <SeekButton
                    seconds={-SEEK_TIME}
                    className="media-button--seek"
                    render={<Button />}
                    label={() => t('seekBackward', { seconds: SEEK_TIME })}
                  >
                    <SkipBack
                      className="media-icon media-icon--seek"
                      size={ICON_SIZE}
                    />
                  </SeekButton>
                }
              />
              <Tooltip.Popup className="media-surface media-tooltip">
                {t('seekBackward', { seconds: SEEK_TIME })}
              </Tooltip.Popup>
            </Tooltip.Root>
            <Tooltip.Root side="top">
              <Tooltip.Trigger
                render={
                  <SeekButton
                    seconds={SEEK_TIME}
                    className="media-button--seek"
                    render={<Button />}
                    label={() => t('seekForward', { seconds: SEEK_TIME })}
                  >
                    <SkipForward
                      className="media-icon media-icon--seek"
                      size={ICON_SIZE}
                    />
                  </SeekButton>
                }
              />
              <Tooltip.Popup className="media-surface media-tooltip">
                {t('seekForward', { seconds: SEEK_TIME })}
              </Tooltip.Popup>
            </Tooltip.Root>
          </div>
          <div className={`media-time-controls ${disabledClass}`}>
            <Time.Value type="current" className="media-time" />
            <TimeSlider.Root className="media-slider">
              <Slider.Track className="media-slider__track">
                <Slider.Fill className="media-slider__fill" />
                <Slider.Buffer className="media-slider__buffer" />
              </Slider.Track>
              <Slider.Thumb className="media-slider__thumb" />
              <div className="media-surface media-preview media-slider__preview">
                <Slider.Thumbnail className="media-preview__thumbnail" />
                <Slider.Value
                  type="pointer"
                  className="media-time media-preview__time"
                />
                <Loader2 className="media-preview__spinner media-icon" />
              </div>
            </TimeSlider.Root>
            <Time.Value type="duration" className="media-time" />
          </div>
          <div className="media-button-group">
            {onTogglePlaylist && (
              <Tooltip.Root side="top">
                <Tooltip.Trigger
                  render={
                    <Button onClick={onTogglePlaylist}>
                      <ListVideo className="media-icon" size={ICON_SIZE} />
                    </Button>
                  }
                />
                <Tooltip.Popup className="media-surface media-tooltip">
                  {t('playlist')}
                </Tooltip.Popup>
              </Tooltip.Root>
            )}
            <Tooltip.Root side="top">
              <Tooltip.Trigger
                render={
                  <PlaybackRateButton
                    className="media-button--playback-rate"
                    render={<Button />}
                  />
                }
              />
              <Tooltip.Popup className="media-surface media-tooltip">
                {t('togglePlaybackRate')}
              </Tooltip.Popup>
            </Tooltip.Root>
            <VolumePopover t={t} />
            <Tooltip.Root side="top">
              <Tooltip.Trigger
                render={
                  <CaptionsButton
                    className="media-button--captions"
                    render={<Button />}
                    label={(state: { subtitlesShowing: boolean }) =>
                      state.subtitlesShowing
                        ? t('disableCaptions')
                        : t('enableCaptions')
                    }
                  >
                    <Subtitles
                      className="media-icon media-icon--captions-off"
                      size={ICON_SIZE}
                    />
                    <Subtitles
                      className="media-icon media-icon--captions-on"
                      size={ICON_SIZE}
                    />
                  </CaptionsButton>
                }
              />
              <Tooltip.Popup className="media-surface media-tooltip" />
            </Tooltip.Root>
            <Tooltip.Root side="top">
              <Tooltip.Trigger
                render={
                  <PiPButton
                    className="media-button--pip"
                    render={<Button />}
                    label={(state: { pip: boolean }) =>
                      state.pip ? t('exitPip') : t('enterPip')
                    }
                  >
                    <PictureInPicture2
                      className="media-icon media-icon--pip-enter"
                      size={ICON_SIZE}
                    />
                    <PictureInPicture2
                      className="media-icon media-icon--pip-exit"
                      size={ICON_SIZE}
                    />
                  </PiPButton>
                }
              />
              <Tooltip.Popup className="media-surface media-tooltip" />
            </Tooltip.Root>
            <Tooltip.Root side="top">
              <Tooltip.Trigger
                render={
                  <FullscreenButton
                    className="media-button--fullscreen"
                    render={<Button />}
                    label={(state: { fullscreen: boolean }) =>
                      state.fullscreen
                        ? t('exitFullscreen')
                        : t('enterFullscreen')
                    }
                  >
                    <Maximize
                      className="media-icon media-icon--fullscreen-enter"
                      size={ICON_SIZE}
                    />
                    <Minimize
                      className="media-icon media-icon--fullscreen-exit"
                      size={ICON_SIZE}
                    />
                  </FullscreenButton>
                }
              />
              <Tooltip.Popup className="media-surface media-tooltip" />
            </Tooltip.Root>
          </div>
        </Tooltip.Provider>
      </Controls.Root>
      <div className="media-overlay" />
    </Container>
  )
}
