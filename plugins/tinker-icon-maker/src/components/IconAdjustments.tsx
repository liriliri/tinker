import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AdjustmentSlider } from 'share/components/Slider'
import { ICON_LIMITS } from '../lib/config'
import { DEFAULT_ICON } from '../lib/presets'
import store from '../store'

const IconAdjustments = observer(function IconAdjustments() {
  const { t } = useTranslation()
  const { icon } = store

  return (
    <>
      <AdjustmentSlider
        label={t('size')}
        value={icon.size}
        min={ICON_LIMITS.size.min}
        max={ICON_LIMITS.size.max}
        step={1}
        defaultValue={DEFAULT_ICON.size}
        onChange={(size) => store.updateIcon({ size })}
      />
      <AdjustmentSlider
        label={t('imageScale')}
        value={icon.imageScale}
        min={ICON_LIMITS.imageScale.min}
        max={ICON_LIMITS.imageScale.max}
        step={1}
        defaultValue={DEFAULT_ICON.imageScale}
        onChange={(imageScale) => store.updateIcon({ imageScale })}
      />
      <AdjustmentSlider
        label={t('rotate')}
        value={icon.rotate}
        min={ICON_LIMITS.rotate.min}
        max={ICON_LIMITS.rotate.max}
        step={1}
        defaultValue={DEFAULT_ICON.rotate}
        onChange={(rotate) => store.updateIcon({ rotate })}
      />
      <AdjustmentSlider
        label={t('offsetX')}
        value={icon.offsetX}
        min={ICON_LIMITS.offsetX.min}
        max={ICON_LIMITS.offsetX.max}
        step={1}
        defaultValue={DEFAULT_ICON.offsetX}
        onChange={(offsetX) => store.updateIcon({ offsetX })}
      />
      <AdjustmentSlider
        label={t('offsetY')}
        value={icon.offsetY}
        min={ICON_LIMITS.offsetY.min}
        max={ICON_LIMITS.offsetY.max}
        step={1}
        defaultValue={DEFAULT_ICON.offsetY}
        onChange={(offsetY) => store.updateIcon({ offsetY })}
      />
    </>
  )
})

export default IconAdjustments
