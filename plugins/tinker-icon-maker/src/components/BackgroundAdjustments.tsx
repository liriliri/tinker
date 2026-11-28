import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import map from 'licia/map'
import { AdjustmentSlider } from 'share/components/Slider'
import { tw } from 'share/theme'
import { BACKGROUND_COLOR_PRESETS, DEFAULT_BACKGROUND } from '../lib/presets'
import { BACKGROUND_LIMITS } from '../lib/config'
import store from '../store'
import ColorSwatch from './ColorSwatch'
import SwitchRow from './SwitchRow'

const TAB_ON = [tw.primary.bg, 'text-white']
const TAB_OFF = [tw.bg.secondary, tw.text.secondary, tw.hover]

const BACKGROUND_MODES = [
  { labelKey: 'solid', useGradient: false },
  { labelKey: 'gradient', useGradient: true },
] as const

const BackgroundAdjustments = observer(function BackgroundAdjustments() {
  const { t } = useTranslation()
  const { background } = store

  return (
    <>
      <SwitchRow
        className="mb-2"
        label={t('transparent')}
        checked={background.transparent}
        onChange={(transparent) => store.updateBackground({ transparent })}
      />

      {!background.transparent && (
        <>
          <div className="mb-2 flex gap-1">
            {map(BACKGROUND_MODES, (mode) => (
              <button
                key={mode.labelKey}
                type="button"
                className={className(
                  'flex-1 rounded py-1.5 text-[11px]',
                  background.useGradient === mode.useGradient ? TAB_ON : TAB_OFF
                )}
                onClick={() =>
                  store.updateBackground({ useGradient: mode.useGradient })
                }
              >
                {t(mode.labelKey)}
              </button>
            ))}
          </div>

          <div className="mb-2 flex items-center gap-2">
            <ColorSwatch
              className="h-8 min-w-0 flex-1 w-auto"
              value={background.color}
              onChange={(color) => store.updateBackground({ color })}
            />
            {background.useGradient && (
              <ColorSwatch
                className="h-8 min-w-0 flex-1 w-auto"
                value={background.gradientEnd}
                onChange={(gradientEnd) =>
                  store.updateBackground({ gradientEnd })
                }
              />
            )}
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1.5">
            {map(BACKGROUND_COLOR_PRESETS, (preset) => {
              const active = store.isBackgroundColorPresetActive(preset)
              const fill = preset.gradientEnd
                ? `linear-gradient(${preset.gradientAngle ?? 135}deg, ${
                    preset.color
                  }, ${preset.gradientEnd})`
                : preset.color
              return (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.id}
                  className={className(
                    'aspect-square w-full rounded border',
                    active ? tw.primary.border : tw.border
                  )}
                  style={{ background: fill }}
                  onClick={() => store.applyBackgroundColorPreset(preset)}
                />
              )
            })}
          </div>

          {background.useGradient && (
            <AdjustmentSlider
              label={t('angle')}
              value={background.gradientAngle}
              min={BACKGROUND_LIMITS.gradientAngle.min}
              max={BACKGROUND_LIMITS.gradientAngle.max}
              step={1}
              defaultValue={DEFAULT_BACKGROUND.gradientAngle}
              onChange={(gradientAngle) =>
                store.updateBackground({ gradientAngle })
              }
            />
          )}
        </>
      )}
    </>
  )
})

export default BackgroundAdjustments
