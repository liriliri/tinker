import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AdjustmentSlider } from 'share/components/Slider'
import { tw } from 'share/theme'
import { ICON_LIMITS } from '../lib/config'
import { DEFAULT_ICON } from '../lib/presets'
import store from '../store'
import ColorSwatch from './ColorSwatch'
import SwitchRow from './SwitchRow'

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
          <AdjustmentSlider
            label={t('shadowBlur')}
            value={icon.shadowBlur}
            min={ICON_LIMITS.shadowBlur.min}
            max={ICON_LIMITS.shadowBlur.max}
            step={1}
            defaultValue={DEFAULT_ICON.shadowBlur}
            onChange={(shadowBlur) => store.updateIcon({ shadowBlur })}
          />
          <AdjustmentSlider
            label={t('shadowOpacity')}
            value={icon.shadowOpacity}
            min={ICON_LIMITS.shadowOpacity.min}
            max={ICON_LIMITS.shadowOpacity.max}
            step={1}
            defaultValue={DEFAULT_ICON.shadowOpacity}
            onChange={(shadowOpacity) => store.updateIcon({ shadowOpacity })}
          />
          <AdjustmentSlider
            label={t('shadowOffsetY')}
            value={icon.shadowOffsetY}
            min={ICON_LIMITS.shadowOffsetY.min}
            max={ICON_LIMITS.shadowOffsetY.max}
            step={1}
            defaultValue={DEFAULT_ICON.shadowOffsetY}
            onChange={(shadowOffsetY) => store.updateIcon({ shadowOffsetY })}
          />
        </>
      )}
    </>
  )
})

export default ShadowAdjustments
