import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AdjustmentSlider } from 'share/components/Slider'
import { BACKGROUND_LIMITS, SQUIRCLE_PERCENT } from '../lib/config'
import { DEFAULT_BACKGROUND } from '../lib/presets'
import store from '../store'

const ShapeAdjustments = observer(function ShapeAdjustments() {
  const { t } = useTranslation()
  const { background } = store

  return (
    <>
      <AdjustmentSlider
        label={t('squircle')}
        value={Math.round(background.squircle * SQUIRCLE_PERCENT)}
        min={BACKGROUND_LIMITS.squircle.min * SQUIRCLE_PERCENT}
        max={BACKGROUND_LIMITS.squircle.max * SQUIRCLE_PERCENT}
        step={1}
        defaultValue={DEFAULT_BACKGROUND.squircle * SQUIRCLE_PERCENT}
        onChange={(value) =>
          store.updateBackground({ squircle: value / SQUIRCLE_PERCENT })
        }
      />
      {background.squircle === 0 && (
        <AdjustmentSlider
          label={t('rounded')}
          value={background.rounded}
          min={BACKGROUND_LIMITS.rounded.min}
          max={BACKGROUND_LIMITS.rounded.max}
          step={1}
          defaultValue={DEFAULT_BACKGROUND.rounded}
          onChange={(rounded) => store.updateBackground({ rounded })}
        />
      )}
      <AdjustmentSlider
        label={t('padding')}
        value={background.padding}
        min={BACKGROUND_LIMITS.padding.min}
        max={BACKGROUND_LIMITS.padding.max}
        step={1}
        defaultValue={DEFAULT_BACKGROUND.padding}
        onChange={(padding) => store.updateBackground({ padding })}
      />
    </>
  )
})

export default ShapeAdjustments
