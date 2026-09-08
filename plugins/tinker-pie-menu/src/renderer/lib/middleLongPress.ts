const LONG_PRESS_MS = 450
const MOVE_TOLERANCE_SQ = 100

type PointHandler = (point: { x: number; y: number }) => void

let disposers: Array<() => void> = []
let pressTimer: ReturnType<typeof setTimeout> | null = null
let pressPoint: { x: number; y: number } | null = null

function clearPressTimer() {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
  pressPoint = null
}

export async function startMiddleLongPress(onTrigger: PointHandler) {
  await stopMiddleLongPress()

  const offDown = await tinker.registerMouse('down', (event) => {
    if (event.button !== 'middle') return
    clearPressTimer()
    pressPoint = { x: event.x, y: event.y }
    pressTimer = setTimeout(() => {
      const point = pressPoint
      pressTimer = null
      pressPoint = null
      if (point) onTrigger(point)
    }, LONG_PRESS_MS)
  })

  const offUp = await tinker.registerMouse('up', (event) => {
    if (event.button !== 'middle') return
    clearPressTimer()
  })

  const offMove = await tinker.registerMouse('move', (event) => {
    if (!pressPoint) return
    const dx = event.x - pressPoint.x
    const dy = event.y - pressPoint.y
    if (dx * dx + dy * dy > MOVE_TOLERANCE_SQ) {
      clearPressTimer()
    }
  })

  disposers = [offDown, offUp, offMove]
}

export async function stopMiddleLongPress() {
  clearPressTimer()
  const current = disposers
  disposers = []
  for (const dispose of current) {
    dispose()
  }
}
