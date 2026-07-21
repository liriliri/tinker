import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import fullscreen from 'licia/fullscreen'
import { t } from 'common/util'
import Style from './Screencast.module.scss'
import store from '../store'
import { useScreencast } from '../lib/hooks'

interface ScreencastProps {
  pluginId: string
}

export default observer(function Screencast({ pluginId }: ScreencastProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(fullscreen.isActive())
  const {
    canvasRef,
    pasteText,
    onMouse,
    onWheel,
    onKeyDown,
    onKeyUp,
    onPaste,
  } = useScreencast(pluginId)

  useEffect(() => {
    const onChange = () => setIsFullscreen(fullscreen.isActive())
    fullscreen.on('change', onChange)
    return () => {
      fullscreen.off('change', onChange)
    }
  }, [])

  const sendText = () => {
    if (!store.screencastActive) return
    if (!text) return
    pasteText(text)
    setText('')
  }

  return (
    <div ref={rootRef} className={Style.root}>
      <header className={Style.bar}>
        <a href="/" className={Style.back} aria-label={t('back')}>
          <span className="icon-left" />
        </a>
        <span className={Style.title}>{store.pluginName}</span>
        <div className={Style.actions}>
          <span className={Style.status}>{store.status}</span>
          {fullscreen.isEnabled() ? (
            <button
              type="button"
              className={Style.iconBtn}
              aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
              onClick={() => fullscreen.toggle(rootRef.current || undefined)}
            >
              <span className="icon-fullscreen" />
            </button>
          ) : null}
        </div>
      </header>
      {store.screencastError ? (
        <div className={Style.error}>{store.screencastError}</div>
      ) : null}
      <div className={Style.viewport}>
        <canvas
          ref={canvasRef}
          className={Style.canvas}
          tabIndex={0}
          onMouseDown={onMouse}
          onMouseUp={onMouse}
          onMouseMove={onMouse}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onPaste={onPaste}
          onContextMenu={(e) => e.preventDefault()}
        />
        {!store.screencastActive ? (
          <div className={Style.glasspane}>{t('notActive')}</div>
        ) : null}
      </div>
      <form
        className={Style.composer}
        onSubmit={(event) => {
          event.preventDefault()
          sendText()
        }}
      >
        <input
          className={Style.input}
          type="text"
          value={text}
          placeholder={t('inputText')}
          disabled={!store.screencastActive}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          className={Style.send}
          type="submit"
          disabled={!store.screencastActive || !text}
        >
          {t('send')}
        </button>
      </form>
    </div>
  )
})
