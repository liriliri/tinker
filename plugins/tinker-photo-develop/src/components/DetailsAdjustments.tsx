import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import {
  NOISE_REDUCTION_RANGE,
  SHARPNESS_RANGE,
  SHARPNESS_THRESHOLD_RANGE,
  type DetailsAdjustmentKey,
} from '../types'
import { AdjustmentSlider } from 'share/components/Slider'

const SHARPENING_SLIDERS: {
  key: DetailsAdjustmentKey
  labelKey: string
  range: typeof SHARPNESS_RANGE | typeof SHARPNESS_THRESHOLD_RANGE
}[] = [
  { key: 'sharpness', labelKey: 'sharpness', range: SHARPNESS_RANGE },
  {
    key: 'sharpnessThreshold',
    labelKey: 'threshold',
    range: SHARPNESS_THRESHOLD_RANGE,
  },
]

const NOISE_REDUCTION_SLIDERS: {
  key: DetailsAdjustmentKey
  labelKey: string
  range: typeof NOISE_REDUCTION_RANGE
}[] = [
  {
    key: 'lumaNoiseReduction',
    labelKey: 'lumaNoise',
    range: NOISE_REDUCTION_RANGE,
  },
  {
    key: 'colorNoiseReduction',
    labelKey: 'colorNoise',
    range: NOISE_REDUCTION_RANGE,
  },
]

const DetailsAdjustments = observer(function DetailsAdjustments() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className={`rounded-md p-3 ${tw.bg.primary}`}>
        <h4 className={`text-xs font-medium mb-2 ${tw.text.primary}`}>
          {t('sharpening')}
        </h4>
        <div className="[&>*:last-child]:mb-0">
          {SHARPENING_SLIDERS.map(({ key, labelKey, range }) => (
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
          {t('noiseReduction')}
        </h4>
        <div className="[&>*:last-child]:mb-0">
          {NOISE_REDUCTION_SLIDERS.map(({ key, labelKey, range }) => (
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

export default DetailsAdjustments
