import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { SkipForward, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { tw } from 'share/theme'
import store from '../store'

const BUTTON_CLASSES = `${tw.text.light.secondary} ${tw.text.dark.tertiary} hover:text-gray-800 dark:hover:text-gray-200 transition-colors`

export default observer(function Footer() {
  const { t } = useTranslation()
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  return (
    <div className="flex items-center justify-between px-6 pb-4 relative">
      {/* Left: Skip and Volume */}
      <div className="flex items-center gap-3">
        <button onClick={() => store.skip()} className={BUTTON_CLASSES}>
          <SkipForward size={18} />
        </button>
        <div
          className="relative flex items-center"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button onClick={() => store.toggleMute()} className={BUTTON_CLASSES}>
            {store.volume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {showVolumeSlider && (
            <div
              className="absolute bottom-full right-1/2 pb-1 p-2 h-24 w-8 flex items-center justify-center"
              style={{ transform: 'translateX(50%) rotate(-90deg)' }}
            >
              <input
                type="range"
                min="0"
                max="100"
                value={store.volume}
                onChange={(e) => store.setVolume(Number(e.target.value))}
                className="w-24 cursor-pointer appearance-none bg-transparent focus:outline-none
                  [&::-webkit-slider-runnable-track]:h-[3px]
                  [&::-webkit-slider-runnable-track]:bg-gray-500/30
                  [&::-webkit-slider-runnable-track]:rounded-full
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-[18px]
                  [&::-webkit-slider-thumb]:h-[18px]
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gray-400
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-gray-400
                  [&::-webkit-slider-thumb]:-mt-[7px]
                  [&::-webkit-slider-thumb]:transition-colors
                  [&::-webkit-slider-thumb]:hover:bg-gray-300
                  [&::-webkit-slider-thumb]:hover:border-gray-300
                  [&::-moz-range-track]:h-[3px]
                  [&::-moz-range-track]:bg-gray-500/30
                  [&::-moz-range-track]:rounded-full
                  [&::-moz-range-thumb]:w-[18px]
                  [&::-moz-range-thumb]:h-[18px]
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-gray-400
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-gray-400
                  [&::-moz-range-thumb]:transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {/* Center: Round counter */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span
          className={`text-base ${tw.text.light.secondary} ${tw.text.dark.tertiary}`}
        >
          {store.currentRound}/{store.totalRounds}
          {store.totalFocusCompleted > 0 && (
            <span
              className="ml-1 text-sm text-gray-500"
              title="Focus rounds completed"
            >
              ({store.totalFocusCompleted})
            </span>
          )}
        </span>
      </div>

      {/* Right: Reset */}
      <div className="flex items-center">
        <button
          onClick={() => store.reset()}
          className={BUTTON_CLASSES}
          title={t('reset')}
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  )
})
