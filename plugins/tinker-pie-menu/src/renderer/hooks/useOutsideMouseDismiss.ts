import { useEffect, useRef } from 'react'

function isInsidePopup(popup: Window, x: number, y: number) {
  const left = popup.screenX
  const top = popup.screenY
  const right = left + popup.outerWidth
  const bottom = top + popup.outerHeight
  return x >= left && x <= right && y >= top && y <= bottom
}

export function useOutsideMouseDismiss(
  popup: Window,
  enabled: boolean,
  onDismiss: () => void
) {
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    let disposed = false
    let dispose: (() => void) | undefined

    void tinker
      .registerMouse('click', (event) => {
        if (!enabledRef.current) return
        if (event.button !== 'left') return
        if (isInsidePopup(popup, event.x, event.y)) return
        onDismissRef.current()
      })
      .then((off) => {
        if (disposed) off()
        else dispose = off
      })

    return () => {
      disposed = true
      dispose?.()
    }
  }, [popup])
}
