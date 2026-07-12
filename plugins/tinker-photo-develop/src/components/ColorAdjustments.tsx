import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { COLOR_RANGE, type ColorAdjustmentKey } from '../types'
import store from '../store'
import { AdjustmentSlider } from 'share/components/Slider'

const COLOR_SLIDERS: {
  key: ColorAdjustmentKey
  labelKey: string
  trackClassName?: string
}[] = [
  {
    key: 'temperature',
    labelKey: 'temperature',
    trackClassName: 'temperature-gradient-track',
  },
  { key: 'tint', labelKey: 'tint', trackClassName: 'tint-gradient-track' },
  { key: 'vibrance', labelKey: 'vibrance' },
  { key: 'saturation', labelKey: 'saturation' },
]

const ColorAdjustments = observer(function ColorAdjustments() {
  const { t } = useTranslation()

  return (
    <div>
      {COLOR_SLIDERS.map(({ key, labelKey, trackClassName }) => (
        <AdjustmentSlider
          key={key}
          label={t(labelKey)}
          value={store.adjustments[key]}
          min={COLOR_RANGE.min}
          max={COLOR_RANGE.max}
          step={COLOR_RANGE.step}
          defaultValue={COLOR_RANGE.default}
          trackClassName={trackClassName}
          onChange={(value) => store.setAdjustment(key, value)}
        />
      ))}
    </div>
  )
})

export default ColorAdjustments
