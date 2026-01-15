import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

const SettingsPanel = observer(() => {
  const { t } = useTranslation()

  return (
    <div className={`w-60 ${tw.bg.both.primary} ${tw.border.both.left} flex flex-col`}>
      <div className="p-6 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${tw.text.both.primary}`}>
              {t('padding')}
            </label>
            <input
              type="number"
              value={store.padding}
              onChange={(e) => store.setPadding(Number(e.target.value))}
              className={`w-16 px-2 py-1 text-sm text-right ${tw.bg.both.secondary} ${tw.text.both.primary} ${tw.border.both.full} rounded`}
              min={0}
              max={100}
            />
            <span className={`text-sm ${tw.text.both.secondary} ml-2`}>px</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={store.padding}
            onChange={(e) => store.setPadding(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${tw.text.both.primary}`}>
              {t('spacing')}
            </label>
            <input
              type="number"
              value={store.spacing}
              onChange={(e) => store.setSpacing(Number(e.target.value))}
              className={`w-16 px-2 py-1 text-sm text-right ${tw.bg.both.secondary} ${tw.text.both.primary} ${tw.border.both.full} rounded`}
              min={0}
              max={100}
            />
            <span className={`text-sm ${tw.text.both.secondary} ml-2`}>px</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={store.spacing}
            onChange={(e) => store.setSpacing(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${tw.text.both.primary}`}>
              {t('radius')}
            </label>
            <Checkbox
              checked={store.radiusEnabled}
              onChange={() => store.toggleRadius()}
            />
            <input
              type="number"
              value={store.radius}
              onChange={(e) => store.setRadius(Number(e.target.value))}
              className={`w-16 px-2 py-1 text-sm text-right ${tw.bg.both.secondary} ${tw.text.both.primary} ${tw.border.both.full} rounded`}
              min={0}
              max={100}
              disabled={!store.radiusEnabled}
            />
            <span className={`text-sm ${tw.text.both.secondary} ml-2`}>px</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={store.radius}
            onChange={(e) => store.setRadius(Number(e.target.value))}
            className="w-full"
            disabled={!store.radiusEnabled}
          />
        </div>
      </div>
    </div>
  )
})

export default SettingsPanel
