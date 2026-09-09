import { useEffect, useRef } from 'react'
import each from 'licia/each'
import { BALL_SIZE } from '../types'
import { popupCenter } from '../lib/util'

const CLICK_MOVE_PX = 16

function isOverBall(popup: Window, x: number, y: number) {
  const { x: cx, y: cy } = popupCenter(popup)
  const r = BALL_SIZE / 2
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

function movedPastThreshold(
  popup: Window,
  down: { x: number; y: number; winX: number; winY: number },
  x: number,
  y: number
) {
  return (
    Math.abs(x - down.x) > CLICK_MOVE_PX ||
    Math.abs(y - down.y) > CLICK_MOVE_PX ||
    Math.abs(popup.screenX - down.winX) > CLICK_MOVE_PX ||
    Math.abs(popup.screenY - down.winY) > CLICK_MOVE_PX
  )
}

export function useBallPointer(
  popup: Window,
  options: {
    clickThrough: boolean
    ballClickEnabled: boolean
    onBallClick: () => void
    onBallPress?: (pressed: boolean) => void
  }
) {
  const { clickThrough, ballClickEnabled, onBallClick, onBallPress } = options
  const clickThroughRef = useRef(clickThrough)
  clickThroughRef.current = clickThrough
  const ballClickEnabledRef = useRef(ballClickEnabled)
  ballClickEnabledRef.current = ballClickEnabled
  const onBallClickRef = useRef(onBallClick)
  onBallClickRef.current = onBallClick
  const onBallPressRef = useRef(onBallPress)
  onBallPressRef.current = onBallPress
  const overBallRef = useRef(false)
  const pressedRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const downRef = useRef<{
    x: number
    y: number
    winX: number
    winY: number
  } | null>(null)

  function setPressed(pressed: boolean) {
    if (pressedRef.current === pressed) return
    pressedRef.current = pressed
    onBallPressRef.current?.(pressed)
  }

  useEffect(() => {
    if (!popup.setIgnoreMouseEvents) return
    const setIgnore = popup.setIgnoreMouseEvents.bind(popup)

    if (!clickThrough) {
      overBallRef.current = false
      void setIgnore(false)
      return
    }

    const pos = lastPosRef.current
    const over = pos ? isOverBall(popup, pos.x, pos.y) : false
    overBallRef.current = over
    void setIgnore(!over)
  }, [popup, clickThrough])

  useEffect(() => {
    if (!popup.setIgnoreMouseEvents) return
    const setIgnore = popup.setIgnoreMouseEvents.bind(popup)
    let disposed = false
    const disposers: Array<() => void> = []

    function track(offPromise: Promise<() => void>) {
      void offPromise.then((off) => {
        if (disposed) off()
        else disposers.push(off)
      })
    }

    function applyHit(over: boolean) {
      if (!clickThroughRef.current) return
      if (overBallRef.current === over) return
      overBallRef.current = over
      void setIgnore(!over)
    }

    track(
      tinker.registerMouse('move', (event) => {
        lastPosRef.current = { x: event.x, y: event.y }
        const down = downRef.current
        if (down && movedPastThreshold(popup, down, event.x, event.y)) {
          setPressed(false)
        }
        if (!clickThroughRef.current) return
        applyHit(isOverBall(popup, event.x, event.y))
      })
    )

    track(
      tinker.registerMouse('down', (event) => {
        if (event.button !== 'left') return
        if (!isOverBall(popup, event.x, event.y)) {
          downRef.current = null
          setPressed(false)
          return
        }
        downRef.current = {
          x: event.x,
          y: event.y,
          winX: popup.screenX,
          winY: popup.screenY,
        }
        setPressed(true)
      })
    )

    track(
      tinker.registerMouse('up', (event) => {
        if (event.button !== 'left') return
        setPressed(false)
      })
    )

    track(
      tinker.registerMouse('click', (event) => {
        if (!ballClickEnabledRef.current) return
        if (event.button !== 'left') return
        const down = downRef.current
        downRef.current = null
        setPressed(false)
        if (!down) return
        if (!isOverBall(popup, event.x, event.y)) return
        if (movedPastThreshold(popup, down, event.x, event.y)) return
        onBallClickRef.current()
      })
    )

    return () => {
      disposed = true
      each(disposers, (off) => off())
      setPressed(false)
      void setIgnore(false)
    }
  }, [popup])
}
