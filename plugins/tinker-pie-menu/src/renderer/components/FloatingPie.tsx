import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import store from '../store'
import { PIE_SIZE, RING_ANIM_MS, type SlotRing } from '../types'
import { useOutsideMouseDismiss } from '../hooks/useOutsideMouseDismiss'
import { useBallPointer } from '../hooks/useBallPointer'
import PieMenuView from './PieMenuView'

interface FloatingPieProps {
  popup: Window
  onClose: () => void
  dismissOnAction: boolean
  draggable: boolean
}

export default observer(function FloatingPie({
  popup,
  onClose,
  dismissOnAction,
  draggable,
}: FloatingPieProps) {
  const [expanded, setExpanded] = useState(dismissOnAction)
  const [ringVisible, setRingVisible] = useState(false)
  const [ballPressed, setBallPressed] = useState(false)
  const exitingRef = useRef(false)
  const exitTimerRef = useRef<number | null>(null)
  const clickThrough = !dismissOnAction && !expanded

  function handleCenterClick() {
    if (expanded) {
      dismiss()
      return
    }
    exitingRef.current = false
    setExpanded(true)
  }

  useBallPointer(popup, {
    clickThrough,
    ballClickEnabled: !dismissOnAction,
    onBallClick: handleCenterClick,
    onBallPress: setBallPressed,
  })

  useEffect(() => {
    return () => {
      if (exitTimerRef.current != null) popup.clearTimeout(exitTimerRef.current)
    }
  }, [popup])

  useEffect(() => {
    if (!expanded) {
      setRingVisible(false)
      return
    }
    let cancelled = false
    const id = popup.requestAnimationFrame(() => {
      if (!cancelled && !exitingRef.current) setRingVisible(true)
    })
    return () => {
      cancelled = true
      popup.cancelAnimationFrame(id)
    }
  }, [expanded, popup])

  function dismiss() {
    if (exitingRef.current || !expanded) return
    exitingRef.current = true
    setRingVisible(false)
    if (exitTimerRef.current != null) popup.clearTimeout(exitTimerRef.current)
    exitTimerRef.current = popup.setTimeout(() => {
      exitTimerRef.current = null
      if (dismissOnAction) {
        onClose()
        return
      }
      setExpanded(false)
      exitingRef.current = false
    }, RING_ANIM_MS)
  }

  useOutsideMouseDismiss(popup, expanded, dismiss)

  async function handleSelect(index: number, ring: SlotRing) {
    dismiss()
    await store.runSlot(index, ring)
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-center bg-transparent select-none"
      onClick={expanded ? dismiss : undefined}
    >
      <PieMenuView
        slots={store.slots}
        outerSlots={store.outerSlots}
        dualRing={store.dualRing}
        onSelectSlot={expanded ? handleSelect : undefined}
        size={PIE_SIZE}
        ringVisible={ringVisible}
        showCenter={!dismissOnAction}
        ballDraggable={draggable && !expanded}
        ballPressed={ballPressed}
        iconHoverScale
      />
    </div>
  )
})
