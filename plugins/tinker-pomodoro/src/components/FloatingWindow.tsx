import { observer } from 'mobx-react-lite'
import { Play, Pause } from 'lucide-react'
import { tw } from 'share/theme'
import { openPopupWindow } from 'share/lib/popupWindow'
import store from '../store'
import CircularProgress from './CircularProgress'

const FloatingTimer = observer(function FloatingTimer() {
  const handleClick = () => {
    if (store.isRunning) {
      store.pause()
    } else {
      store.start()
    }
  }

  return (
    <div
      className={`h-screen flex flex-col items-center justify-center ${tw.bg.secondary} transition-colors relative`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-5 z-10"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
      <CircularProgress progress={store.progress} mode={store.mode}>
        <div
          className={`text-5xl font-mono ${tw.text.primary} dark:text-gray-100`}
        >
          {store.formattedTime}
        </div>
        <button
          onClick={handleClick}
          className={`absolute top-[64%] w-10 h-10 rounded-full border-2 border-gray-400 dark:border-gray-500
                     flex items-center justify-center transition-all duration-200
                     hover:bg-gray-100 dark:hover:bg-gray-700`}
        >
          {store.isRunning ? (
            <Pause size={14} className={tw.text.primary} />
          ) : (
            <Play size={14} className={`${tw.text.primary} ml-0.5`} />
          )}
        </button>
      </CircularProgress>
    </div>
  )
})

let popupWindow: Window | null = null

export function openFloatingWindow() {
  if (popupWindow && !popupWindow.closed) {
    popupWindow.focus()
    return
  }
  popupWindow = openPopupWindow(
    { width: 280, height: 280, resizable: false, positionKey: 'pomodoro' },
    () => <FloatingTimer />
  )
}
