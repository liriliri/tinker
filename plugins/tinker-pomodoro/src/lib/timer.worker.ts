let timerId: number | null = null
let elapsed = 0
let totalSeconds = 0

self.onmessage = function (e: MessageEvent) {
  const { type, payload } = e.data

  switch (type) {
    case 'start':
      totalSeconds = payload.totalSeconds
      elapsed = payload.elapsed || 0
      if (timerId === null) {
        timerId = self.setInterval(() => {
          elapsed++
          if (elapsed >= totalSeconds) {
            self.clearInterval(timerId!)
            timerId = null
            self.postMessage({ type: 'complete' })
          } else {
            self.postMessage({ type: 'tick', payload: { elapsed } })
          }
        }, 1000) as unknown as number
      }
      break

    case 'pause':
      if (timerId !== null) {
        self.clearInterval(timerId)
        timerId = null
      }
      break

    case 'reset':
      if (timerId !== null) {
        self.clearInterval(timerId)
        timerId = null
      }
      elapsed = 0
      break

    default:
      break
  }
}

export {}
