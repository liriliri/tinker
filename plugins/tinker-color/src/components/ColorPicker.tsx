import { observer } from 'mobx-react-lite'
import { Wheel } from '@uiw/react-color'
import { useTranslation } from 'react-i18next'
import { Pipette, Clipboard } from 'lucide-react'
import toast from 'react-hot-toast'
import Color from 'color'
import { tw } from 'share/theme'
import store from '../store'
import i18n from '../i18n'

async function handleEyeDropper() {
  if (!('EyeDropper' in window)) {
    return
  }
  try {
    // @ts-ignore - EyeDropper API is not yet in TypeScript types
    const eyeDropper = new EyeDropper()
    const result = await eyeDropper.open()
    if (result.sRGBHex) {
      store.setColor(result.sRGBHex)
    }
  } catch {
    // User cancelled the eyedropper
  }
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText()
    const color = Color(text.trim())
    store.setColor(color.hex())
    toast.success(i18n.t('pasteSuccess'))
  } catch (err) {
    toast.error(i18n.t('pasteFailed'))
    console.error('Failed to parse color:', err)
  }
}

export default observer(function ColorPicker() {
  const { t } = useTranslation()
  const hsl = store.getCurrentHsl()

  return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative flex justify-between items-start">
        <button
          className={`p-1.5 rounded ${tw.hover} ${tw.text.secondary}`}
          title={t('pasteColor')}
          onClick={handlePaste}
        >
          <Clipboard size={14} />
        </button>
        <button
          className={`p-1.5 rounded ${tw.hover} ${tw.text.secondary}`}
          title={t('pickColor')}
          onClick={handleEyeDropper}
        >
          <Pipette size={14} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <Wheel
          color={store.currentColor}
          onChange={(color) => store.handleColorChange(color)}
          width={280}
          height={280}
        />
      </div>

      {/* Saturation Slider */}
      <div className="w-full flex flex-col gap-2 mb-6">
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
      <div className="w-full flex flex-col gap-2 mb-6">
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

      {/* Alpha Slider */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('alpha')}
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {store.alpha}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={store.alpha}
          onChange={(e) => store.setAlpha(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              rgba(0,0,0,0),
              ${store.currentColor})`,
          }}
        />
      </div>
    </div>
  )
})
