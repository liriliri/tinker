import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { tw, THEME_COLORS } from 'share/theme'
import store from '../store'
import { getTimeForTimezone } from '../lib/timezone'

export default observer(function AnalogClock() {
  const [time, setTime] = useState(getTimeForTimezone(store.timezone))

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getTimeForTimezone(store.timezone))
    }, 1000)

    return () => clearInterval(timer)
  }, [store.timezone])

  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  const hourDeg = (hours + minutes / 60) * 30
  const minuteDeg = (minutes + seconds / 60) * 6
  const secondDeg = seconds * 6

  const dateString = time.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const isDark = store.isDark

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: 'clamp(300px, 50vw, 600px)',
        height: 'clamp(300px, 50vw, 600px)',
      }}
    >
      {/* Outer shadow */}
      <div
        className="absolute inset-[-20px] rounded-full opacity-30"
        style={{
          background:
            'radial-gradient(circle, rgba(0,0,0,0.2) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Clock container */}
      <div className="relative w-full h-full">
        {/* Glass clock face */}
        <div
          className="absolute inset-0 rounded-full backdrop-blur-sm overflow-hidden"
          style={{
            backgroundColor: isDark
              ? 'rgba(30, 30, 30, 0.3)'
              : 'rgba(255, 255, 255, 0.3)',
            boxShadow: isDark
              ? 'inset 0 4px 8px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(255,255,255,0.1), 0 10px 30px rgba(0,0,0,0.5)'
              : 'inset 0 4px 8px rgba(0,0,0,0.1), inset 0 -4px 8px rgba(255,255,255,0.5), 0 10px 30px rgba(0,0,0,0.15)',
          }}
        >
          {/* Glossy overlay */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              filter: 'blur(10px)',
            }}
          />

          {/* Edge highlight */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: isDark
                ? '1px solid rgba(255,255,255,0.2)'
                : '1px solid rgba(255,255,255,0.8)',
              boxShadow: isDark
                ? '0 0 10px rgba(255,255,255,0.1)'
                : '0 0 10px rgba(255,255,255,0.5)',
            }}
          />

          {/* Minute markers */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = i * 6
            const isHourMarker = i % 5 === 0
            return (
              <div
                key={`marker-${i}`}
                className="absolute top-0 left-1/2 origin-bottom"
                style={{
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                  height: '50%',
                }}
              >
                <div
                  className="mx-auto"
                  style={{
                    backgroundColor: isDark
                      ? THEME_COLORS.text.dark.secondary
                      : THEME_COLORS.text.dark.tertiary,
                    width: isHourMarker
                      ? 'clamp(1.5px, 0.4vw, 3px)'
                      : 'clamp(1px, 0.2vw, 2px)',
                    height: isHourMarker
                      ? 'clamp(10px, 2vw, 18px)'
                      : 'clamp(6px, 1.2vw, 12px)',
                    opacity: isHourMarker ? 0.8 : 0.4,
                  }}
                />
              </div>
            )
          })}

          {/* Hour numbers */}
          {[12, 3, 6, 9].map((num) => {
            const angle = (num === 12 ? 0 : num * 30) - 90
            const radian = (angle * Math.PI) / 180
            // Position at 40% of container size (80% of radius)
            const xPercent = Math.cos(radian) * 40
            const yPercent = Math.sin(radian) * 40
            return (
              <div
                key={num}
                className={`absolute font-medium ${tw.text.primary}`}
                style={{
                  left: `calc(50% + ${xPercent}%)`,
                  top: `calc(50% + ${yPercent}%)`,
                  fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                  transform: 'translate(-50%, -50%)',
                  textShadow: isDark
                    ? '0 1px 2px rgba(0,0,0,0.5)'
                    : '0 1px 2px rgba(255,255,255,0.5)',
                }}
              >
                {num}
              </div>
            )
          })}

          {/* Date display */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 text-sm font-medium ${tw.text.primary} opacity-70`}
            style={{
              top: '65%',
              textShadow: isDark
                ? '0 1px 2px rgba(0,0,0,0.5)'
                : '0 1px 2px rgba(255,255,255,0.3)',
            }}
          >
            {dateString}
          </div>

          {/* Hour hand shadow */}
          <div
            className="absolute left-1/2 bottom-1/2 origin-bottom transition-transform duration-1000"
            style={{
              transform: `translateX(-50%) rotate(${hourDeg}deg)`,
              width: 'clamp(6px, 1.5vw, 10px)',
              height: '22.5%',
              filter: 'blur(3px)',
              opacity: 0.3,
            }}
          >
            <div className="w-full h-full bg-black rounded-full" />
          </div>

          {/* Hour hand */}
          <div
            className="absolute left-1/2 bottom-1/2 origin-bottom transition-transform duration-1000"
            style={{
              transform: `translateX(-50%) rotate(${hourDeg}deg)`,
              width: 'clamp(6px, 1.5vw, 10px)',
              height: '22.5%',
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                backgroundColor: isDark
                  ? THEME_COLORS.text.dark.primary
                  : THEME_COLORS.text.light.primary,
                boxShadow: isDark
                  ? '0 0 8px rgba(255,255,255,0.3)'
                  : '0 0 8px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          {/* Minute hand shadow */}
          <div
            className="absolute left-1/2 bottom-1/2 origin-bottom transition-transform duration-1000"
            style={{
              transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
              width: 'clamp(4px, 1vw, 6px)',
              height: '32.5%',
              filter: 'blur(3px)',
              opacity: 0.3,
            }}
          >
            <div className="w-full h-full bg-black rounded-full" />
          </div>

          {/* Minute hand */}
          <div
            className="absolute left-1/2 bottom-1/2 origin-bottom transition-transform duration-1000"
            style={{
              transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
              width: 'clamp(4px, 1vw, 6px)',
              height: '32.5%',
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                backgroundColor: isDark
                  ? THEME_COLORS.text.dark.primary
                  : THEME_COLORS.text.light.primary,
                boxShadow: isDark
                  ? '0 0 8px rgba(255,255,255,0.3)'
                  : '0 0 8px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          {/* Second hand shadow */}
          <div
            className="absolute left-1/2 origin-bottom"
            style={{
              transform: `translateX(-50%) rotate(${secondDeg}deg)`,
              width: 'clamp(1.5px, 0.4vw, 2.5px)',
              height: '37.5%',
              top: '12.5%',
              filter: 'blur(2px)',
              opacity: 0.2,
            }}
          >
            <div className="w-full h-full bg-black" />
          </div>

          {/* Second hand */}
          <div
            className="absolute left-1/2 origin-bottom"
            style={{
              transform: `translateX(-50%) rotate(${secondDeg}deg)`,
              width: 'clamp(1.5px, 0.4vw, 2.5px)',
              height: '37.5%',
              top: '12.5%',
            }}
          >
            <div
              className="w-full h-full bg-orange-500"
              style={{
                boxShadow: '0 0 8px rgba(255,107,0,0.5)',
              }}
            />
            {/* Counterweight */}
            <div
              className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 bg-orange-500 rounded-b"
              style={{
                width: 'clamp(4px, 1vw, 8px)',
                height: 'clamp(15px, 3vw, 25px)',
                boxShadow: '0 0 8px rgba(255,107,0,0.5)',
              }}
            />
          </div>

          {/* Center blur effect */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full backdrop-blur-sm"
            style={{
              width: 'clamp(30px, 6vw, 50px)',
              height: 'clamp(30px, 6vw, 50px)',
              background: isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(255,255,255,0.35)',
              boxShadow: isDark
                ? '0 0 20px rgba(255,255,255,0.2), inset 0 0 8px rgba(255,255,255,0.3)'
                : '0 0 20px rgba(255,255,255,0.4), inset 0 0 8px rgba(255,255,255,0.6)',
            }}
          />

          {/* Center dot */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 rounded-full"
            style={{
              width: 'clamp(10px, 2vw, 15px)',
              height: 'clamp(10px, 2vw, 15px)',
              boxShadow: '0 0 10px rgba(255,107,0,0.6)',
            }}
          />
        </div>
      </div>
    </div>
  )
})
