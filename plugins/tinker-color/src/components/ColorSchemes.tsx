import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import {
  getColorVariants,
  getComplementaryColor,
  getAnalogousColors,
} from '../lib/util'

export default observer(function ColorSchemes() {
  const { t } = useTranslation()
  const variants = getColorVariants(store.currentColor)
  const complementary = getComplementaryColor(store.currentColor)
  const analogous = getAnalogousColors(store.currentColor)

  return (
    <div className="flex flex-col gap-6">
      {/* Color Variants */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          {t('colorVariants')}
        </h3>
        <div className="grid grid-cols-9 gap-2">
          {variants.map((variant) => (
            <button
              key={variant.lightness}
              className={`aspect-square rounded-lg shadow-sm hover:scale-110 transition-transform cursor-pointer border-2 border-transparent ${tw.primary.hoverBorder} flex flex-col items-center justify-center relative group`}
              style={{ backgroundColor: variant.color }}
              onClick={() => store.copyToClipboardWithToast(variant.color)}
              title={`${variant.color} - Lightness: ${variant.lightness}%`}
            >
              <span
                className="text-xs font-semibold opacity-80 group-hover:opacity-100 transition-opacity"
                style={{
                  color: variant.lightness > 50 ? '#000' : '#fff',
                  textShadow:
                    variant.lightness > 50
                      ? '0 1px 2px rgba(255,255,255,0.5)'
                      : '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {variant.lightness}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Complementary Color */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          {t('complementaryColor')}
        </h3>
        <button
          className="w-full h-15 rounded-xl shadow-lg hover:scale-[1.02] transition-transform cursor-pointer flex items-center justify-center"
          style={{ backgroundColor: complementary }}
          onClick={() => store.copyToClipboardWithToast(complementary)}
          title={t('clickToCopy', { color: complementary })}
        >
          <div className="bg-black/15 backdrop-blur-sm px-4 py-2 rounded-lg">
            <span className="text-white font-mono font-semibold">
              {complementary.toUpperCase()}
            </span>
          </div>
        </button>
      </div>

      {/* Analogous Harmony */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          {t('analogousHarmony')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {analogous.map((color, index) => (
            <button
              key={index}
              className="h-15 rounded-xl shadow-lg hover:scale-[1.02] transition-transform cursor-pointer flex items-center justify-center"
              style={{ backgroundColor: color }}
              onClick={() => store.copyToClipboardWithToast(color)}
              title={t('clickToCopy', { color })}
            >
              <div className="bg-black/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                <span className="text-white font-mono text-sm font-semibold">
                  {color.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})
