import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import map from 'licia/map'
import { AdjustmentSlider } from 'share/components/Slider'
import { tw } from 'share/theme'
import { ICON_LIMITS } from '../lib/config'
import { DEFAULT_ICON } from '../lib/presets'
import store from '../store'
import ColorSwatch from './ColorSwatch'
import SwitchRow from './SwitchRow'

const SHADOW_FIELDS = [
  { key: 'shadowBlur', labelKey: 'shadowBlur' },
  { key: 'shadowOpacity', labelKey: 'shadowOpacity' },
  { key: 'shadowOffsetY', labelKey: 'shadowOffsetY' },
] as const

const ShadowAdjustments = observer(function ShadowAdjustments() {
  const { t } = useTranslation()
  const { icon } = store

  return (
    <>
      <SwitchRow
        className="mb-2"
        label={t('enabled')}
        checked={icon.shadowEnabled}
        onChange={(shadowEnabled) => store.updateIcon({ shadowEnabled })}
      />
      {icon.shadowEnabled && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-xs ${tw.text.primary}`}>
              {t('shadowColor')}
            </span>
            <ColorSwatch
              value={icon.shadowColor}
              onChange={(shadowColor) => store.updateIcon({ shadowColor })}
            />
          </div>
          {map(SHADOW_FIELDS, ({ key, labelKey }) => (
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
      )}
    </>
  )
})

export default ShadowAdjustments
