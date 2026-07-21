import { useCallback, useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { t } from 'common/util'
import Style from './Screencast.module.scss'
import store from '../store'
import { wsUrl } from '../lib/auth'

interface ScreencastProps {
  pluginId: string
}

interface FrameMetadata {
  offsetTop?: number
  pageScaleFactor?: number
  deviceWidth?: number
  deviceHeight?: number
  scrollOffsetX?: number
  scrollOffsetY?: number
}

const BUTTONS = ['left', 'middle', 'right', 'back', 'forward'] as const

function modifiersForEvent(event: KeyboardEvent | MouseEvent) {
  return (
    Number(event.getModifierState('Alt')) |
    (Number(event.getModifierState('Control')) << 1) |
    (Number(event.getModifierState('Meta')) << 2) |
    (Number(event.getModifierState('Shift')) << 3)
  )
}

export default observer(function Screencast({ pluginId }: ScreencastProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const metaRef = useRef<FrameMetadata>({})
  const zoomRef = useRef(1)
  const offsetTopRef = useRef(0)
  const activeOffsetTopRef = useRef<number | null>(null)
  const [text, setText] = useState('')

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !image.naturalWidth) return

    const meta = metaRef.current
    const deviceWidth = meta.deviceWidth || image.naturalWidth
    const deviceHeight = meta.deviceHeight || image.naturalHeight
    const cssWidth = canvas.clientWidth
    const cssHeight = canvas.clientHeight
    if (cssWidth <= 0 || cssHeight <= 0) return

    const zoom = Math.min(cssWidth / deviceWidth, cssHeight / deviceHeight)
    zoomRef.current = zoom
    offsetTopRef.current = meta.offsetTop || 0

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(cssWidth * dpr)
    canvas.height = Math.floor(cssHeight * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, cssWidth, cssHeight)

    const drawW = deviceWidth * zoom
    const drawH = deviceHeight * zoom
    const x = (cssWidth - drawW) / 2
    const y = (cssHeight - drawH) / 2
    ctx.drawImage(image, x, y, drawW, drawH)
    canvas.dataset.offsetX = String(x)
    canvas.dataset.offsetY = String(y)
  }, [])

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
    }
  }, [])

  const sendResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    send({
      type: 'resize',
      width: Math.floor(canvas.clientWidth * dpr),
      height: Math.floor(canvas.clientHeight * dpr),
    })
  }, [send])

  useEffect(() => {
    store.resetScreencast()

    const ws = new WebSocket(
      wsUrl(`/ws/${encodeURIComponent(pluginId)}`, store.credentials)
    )
    wsRef.current = ws

    ws.onopen = () => {
      store.setStatusKey('connected')
      store.setScreencastErrorKey('')
      sendResize()
      window.setTimeout(() => canvasRef.current?.focus(), 0)
    }

    ws.onmessage = (event) => {
      let msg: {
        type?: string
        data?: string
        metadata?: FrameMetadata
        message?: string
        visible?: boolean
      }
      try {
        msg = JSON.parse(String(event.data))
      } catch {
        return
      }
      if (msg.type === 'frame' && msg.data) {
        metaRef.current = msg.metadata || {}
        const image = new Image()
        image.onload = () => {
          imageRef.current = image
          paint()
        }
        image.src = `data:image/jpeg;base64,${msg.data}`
        return
      }
      if (msg.type === 'visibility') {
        store.setScreencastActive(!!msg.visible)
        return
      }
      if (msg.type === 'error') {
        if (msg.message) {
          store.setScreencastErrorRaw(msg.message)
        } else {
          store.setScreencastErrorKey('unknownError')
        }
        return
      }
      if (msg.type === 'closed') {
        location.replace('/')
        return
      }
    }

    ws.onclose = () => {
      store.setStatusKey('disconnected')
    }

    ws.onerror = () => {
      store.setScreencastErrorKey('wsFailed')
    }

    const onResize = () => {
      paint()
      sendResize()
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      ws.close()
      wsRef.current = null
    }
  }, [paint, pluginId, sendResize])

  const toScreenPoint = (event: MouseEvent | WheelEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const offsetX = Number(canvas.dataset.offsetX || 0)
    const offsetY = Number(canvas.dataset.offsetY || 0)
    const zoom = zoomRef.current || 1
    const offsetTop = activeOffsetTopRef.current ?? offsetTopRef.current
    return {
      x: Math.round((event.offsetX - offsetX) / zoom),
      y: Math.round((event.offsetY - offsetY) / zoom - offsetTop),
    }
  }

  const onMouse = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    if (!store.screencastActive) return
    if (event.type === 'mousedown') {
      activeOffsetTopRef.current = offsetTopRef.current
      canvasRef.current?.focus()
    }
    const point = toScreenPoint(event.nativeEvent)
    send({
      type: 'mouse',
      eventType: event.type,
      x: point.x,
      y: point.y,
      button: BUTTONS[event.button] || 'none',
      buttons: event.buttons,
      clickCount: event.detail,
      modifiers: modifiersForEvent(event.nativeEvent),
    })
    if (event.type === 'mouseup') {
      activeOffsetTopRef.current = null
    }
  }

  const onWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    if (!store.screencastActive) return
    if (activeOffsetTopRef.current === null) {
      activeOffsetTopRef.current = offsetTopRef.current
    }
    const point = toScreenPoint(event.nativeEvent)
    const zoom = zoomRef.current || 1
    send({
      type: 'mouse',
      eventType: 'wheel',
      x: point.x,
      y: point.y,
      button: BUTTONS[event.button] || 'none',
      buttons: event.buttons,
      clickCount: event.detail,
      modifiers: modifiersForEvent(event.nativeEvent),
      deltaX: event.deltaX / zoom,
      deltaY: event.deltaY / zoom,
    })
  }

  const insertTextForKey = (event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return undefined
    }
    if (event.key === 'Enter') return '\r'
    if (event.key === 'Tab') return '\t'
    if (event.key.length === 1) return event.key
    return undefined
  }

  const pasteText = useCallback(
    (value: string) => {
      if (!value) return
      send({ type: 'insertText', text: value })
    },
    [send]
  )

  const sendText = () => {
    if (!store.screencastActive) return
    const value = text
    if (!value) return
    pasteText(value)
    setText('')
  }

  const onPaste = (event: React.ClipboardEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!store.screencastActive) return
    const text = event.clipboardData.getData('text/plain')
    pasteText(text)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    event.stopPropagation()
    if (!store.screencastActive) return

    if (
      (event.metaKey || event.ctrlKey) &&
      !event.altKey &&
      event.key.toLowerCase() === 'v'
    ) {
      return
    }

    event.preventDefault()
    const modifiers = modifiersForEvent(event.nativeEvent)
    const base = {
      type: 'key' as const,
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      modifiers,
      autoRepeat: event.repeat,
      location: event.location,
    }
    send({ ...base, eventType: 'keydown' })
    const text = insertTextForKey(event)
    if (text) {
      send({ ...base, eventType: 'char', text })
    }
  }

  const onKeyUp = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    event.stopPropagation()
    if (!store.screencastActive) return
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
      return
    }
    event.preventDefault()
    send({
      type: 'key',
      eventType: 'keyup',
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      modifiers: modifiersForEvent(event.nativeEvent),
      autoRepeat: event.repeat,
      location: event.location,
    })
  }

  return (
    <div className={Style.root}>
      <header className={Style.bar}>
        <a href="/" className={Style.back} aria-label={t('back')}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </a>
        <span className={Style.title}>{store.pluginName}</span>
        <span className={Style.status}>{store.status}</span>
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
