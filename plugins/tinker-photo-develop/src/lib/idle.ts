interface IdleDeadline {
  didTimeout: boolean
  timeRemaining(): number
}

export function runWhenIdle<T>(
  callback: (deadline: IdleDeadline) => T | Promise<T>,
  options?: { timeout?: number }
): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = async (deadline: IdleDeadline) => {
      try {
        resolve(await callback(deadline))
      } catch (error) {
        reject(error)
      }
    }

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback((deadline) => void run(deadline), {
        timeout: options?.timeout ?? 2000,
      })
      return
    }

    window.setTimeout(() => {
      void run({
        didTimeout: true,
        timeRemaining: () => 0,
      })
    }, 1)
  })
}
