import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import map from 'licia/map'
import { AdjustmentSlider } from 'share/components/Slider'
import { ICON_LIMITS } from '../lib/config'
import { DEFAULT_ICON } from '../lib/presets'
import store from '../store'

const ICON_FIELDS = [
  { key: 'size', labelKey: 'size' },
  { key: 'imageScale', labelKey: 'imageScale' },
  { key: 'rotate', labelKey: 'rotate' },
  { key: 'offsetX', labelKey: 'offsetX' },
  { key: 'offsetY', labelKey: 'offsetY' },
] as const

const IconAdjustments = observer(function IconAdjustments() {
  const { t } = useTranslation()
  const { icon } = store

  return (
    <>
      {map(ICON_FIELDS, ({ key, labelKey }) => (
        <AdjustmentSlider
          key={key}
          label={t(labelKey)}
          value={icon[key]}
          min={ICON_LIMITS[key].min}
          max={ICON_LIMITS[key].max}
          step={1}
          defaultValue={DEFAULT_ICON[key]}
          onChange={(value) => store.updateIcon({ [key]: value })}
        />
      ))}
    </>
  )
})

export default IconAdjustments
