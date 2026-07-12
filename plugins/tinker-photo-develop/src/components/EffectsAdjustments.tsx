import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import {
  GRAIN_AMOUNT_RANGE,
  GRAIN_ROUGHNESS_RANGE,
  GRAIN_SIZE_RANGE,
  VIGNETTE_AMOUNT_RANGE,
  VIGNETTE_FEATHER_RANGE,
  VIGNETTE_MIDPOINT_RANGE,
  VIGNETTE_ROUNDNESS_RANGE,
  type EffectsAdjustmentKey,
} from '../types'
import { AdjustmentSlider } from 'share/components/Slider'

const VIGNETTE_SLIDERS: {
  key: EffectsAdjustmentKey
  labelKey: string
  range:
    | typeof VIGNETTE_AMOUNT_RANGE
    | typeof VIGNETTE_MIDPOINT_RANGE
    | typeof VIGNETTE_ROUNDNESS_RANGE
    | typeof VIGNETTE_FEATHER_RANGE
}[] = [
  { key: 'vignetteAmount', labelKey: 'amount', range: VIGNETTE_AMOUNT_RANGE },
  {
    key: 'vignetteMidpoint',
    labelKey: 'midpoint',
    range: VIGNETTE_MIDPOINT_RANGE,
  },
  {
    key: 'vignetteRoundness',
    labelKey: 'roundness',
    range: VIGNETTE_ROUNDNESS_RANGE,
  },
  {
    key: 'vignetteFeather',
    labelKey: 'feather',
    range: VIGNETTE_FEATHER_RANGE,
  },
]

const GRAIN_SLIDERS: {
  key: EffectsAdjustmentKey
  labelKey: string
  range:
    | typeof GRAIN_AMOUNT_RANGE
    | typeof GRAIN_SIZE_RANGE
    | typeof GRAIN_ROUGHNESS_RANGE
}[] = [
  { key: 'grainAmount', labelKey: 'amount', range: GRAIN_AMOUNT_RANGE },
  { key: 'grainSize', labelKey: 'size', range: GRAIN_SIZE_RANGE },
  {
    key: 'grainRoughness',
    labelKey: 'roughness',
    range: GRAIN_ROUGHNESS_RANGE,
  },
]

const EffectsAdjustments = observer(function EffectsAdjustments() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className={`rounded-md p-3 ${tw.bg.primary}`}>
        <h4 className={`text-xs font-medium mb-2 ${tw.text.primary}`}>
          {t('vignette')}
        </h4>
        <div className="[&>*:last-child]:mb-0">
          {VIGNETTE_SLIDERS.map(({ key, labelKey, range }) => (
            <AdjustmentSlider
              key={key}
              label={t(labelKey)}
              value={store.adjustments[key]}
              min={range.min}
              max={range.max}
              step={range.step}
              defaultValue={range.default}
              onChange={(value) => store.setAdjustment(key, value)}
            />
          ))}
        </div>
      </div>

      <div className={`rounded-md p-3 ${tw.bg.primary}`}>
        <h4 className={`text-xs font-medium mb-2 ${tw.text.primary}`}>
          {t('grain')}
        </h4>
        <div className="[&>*:last-child]:mb-0">
          {GRAIN_SLIDERS.map(({ key, labelKey, range }) => (
            <AdjustmentSlider
              key={key}
              label={t(labelKey)}
              value={store.adjustments[key]}
              min={range.min}
              max={range.max}
              step={range.step}
              defaultValue={range.default}
              onChange={(value) => store.setAdjustment(key, value)}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

export default EffectsAdjustments
