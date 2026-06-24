import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  BRIGHTNESS_RANGE,
  EXPOSURE_RANGE,
  TONAL_RANGE,
  type BasicAdjustmentKey,
} from '../types'
import store from '../store'
import AdjustmentSlider from './AdjustmentSlider'

const BASIC_SLIDERS: {
  key: BasicAdjustmentKey
  labelKey: string
  range: typeof EXPOSURE_RANGE | typeof BRIGHTNESS_RANGE | typeof TONAL_RANGE
}[] = [
  { key: 'exposure', labelKey: 'evShift', range: EXPOSURE_RANGE },
  { key: 'brightness', labelKey: 'exposure', range: BRIGHTNESS_RANGE },
  { key: 'contrast', labelKey: 'contrast', range: TONAL_RANGE },
  { key: 'highlights', labelKey: 'highlights', range: TONAL_RANGE },
  { key: 'shadows', labelKey: 'shadows', range: TONAL_RANGE },
  { key: 'whites', labelKey: 'whites', range: TONAL_RANGE },
  { key: 'blacks', labelKey: 'blacks', range: TONAL_RANGE },
]

const BasicAdjustments = observer(function BasicAdjustments() {
  const { t } = useTranslation()

  return (
    <div>
      {BASIC_SLIDERS.map(({ key, labelKey, range }) => (
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
  )
})

export default BasicAdjustments
