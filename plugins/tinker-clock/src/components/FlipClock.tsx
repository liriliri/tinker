import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import {
  clock,
  css,
  flipClock,
  theme,
  FlipClock as FlipClockType,
  Clock,
} from 'flipclock'
import store from '../store'

export default observer(function FlipClock() {
  const clockRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<FlipClockType<Clock> | null>(null)

  useEffect(() => {
    if (!clockRef.current) return

    instanceRef.current = flipClock({
      parent: clockRef.current,
      face: clock({
        format: '[HH]:[mm]:[ss]',
      }),
      theme: theme({
        dividers: ':',
        css: css({
          fontSize: 'clamp(6rem, 10vw, 16rem)',
        }),
      }),
    })

    return () => {
      instanceRef.current?.unmount()
    }
  }, [store.timezone])

  return <div ref={clockRef}></div>
})
