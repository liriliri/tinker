import { observer } from 'mobx-react-lite'
import { Wheel } from '@uiw/react-color'
import { useTranslation } from 'react-i18next'
import store from '../store'

export default observer(function ColorPicker() {
  const { t } = useTranslation()
  const hsl = store.getCurrentHsl()

  return (
    <div className="flex flex-col items-center gap-6">
      <Wheel
        color={store.currentColor}
        onChange={(color) => store.handleColorChange(color)}
        width={360}
        height={360}
      />

      {/* Saturation Slider */}
      <div className="w-full max-w-[400px] flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('saturation')}
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {hsl.s}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={hsl.s}
          onChange={(e) => store.adjustSaturation(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-300 to-blue-500 dark:from-gray-600 dark:to-blue-500"
          style={{
            background: `linear-gradient(to right,
              hsl(${hsl.h}, 0%, ${hsl.l}%),
              hsl(${hsl.h}, 100%, ${hsl.l}%))`,
          }}
        />
      </div>

      {/* Lightness Slider */}
      <div className="w-full max-w-[400px] flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('lightness')}
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {hsl.l}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={hsl.l}
          onChange={(e) => store.adjustLightness(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              hsl(${hsl.h}, ${hsl.s}%, 0%),
              hsl(${hsl.h}, ${hsl.s}%, 50%),
              hsl(${hsl.h}, ${hsl.s}%, 100%))`,
          }}
        />
      </div>
    </div>
  )
})
