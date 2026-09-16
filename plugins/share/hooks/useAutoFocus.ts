import { RefObject, useEffect } from 'react'

export function useAutoFocus(
  ref: RefObject<HTMLElement | null>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return

    const focus = () => ref.current?.focus()
    focus()

    if (document.hasFocus() && document.activeElement === ref.current) {
      return
    }

    const onWindowFocus = () => {
      focus()
      if (document.activeElement === ref.current) {
        window.removeEventListener('focus', onWindowFocus)
      }
    }
    window.addEventListener('focus', onWindowFocus)
    return () => window.removeEventListener('focus', onWindowFocus)
  }, [ref, enabled])
}
