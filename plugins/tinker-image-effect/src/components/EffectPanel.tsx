import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import store from '../store'
import { EFFECTS, type EffectId } from '../types'
import EffectParams from './EffectParams'

const EffectPanel = observer(function EffectPanel() {
  const { t, i18n } = useTranslation()

  const effectOptions = useMemo(
    () =>
      EFFECTS.map((effect) => ({
        value: effect.id,
        label: t(effect.nameKey),
      })),
    [t, i18n.language]
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className={`shrink-0 border-b px-3 py-3 ${tw.border}`}>
        <Select<EffectId>
          className="w-full"
          value={store.effectId}
          onChange={(value) => store.setEffect(value)}
          options={effectOptions}
        />
      </div>

      {store.effectId === 'original' ? (
        <div
          className={`min-h-0 flex-1 flex items-center justify-center px-3 text-sm ${tw.text.secondary}`}
        >
          {t('noParameters')}
        </div>
      ) : (
        <OverlayScrollbars defer className="min-h-0 flex-1">
          <div className="px-3 py-3">
            <EffectParams />
          </div>
        </OverlayScrollbars>
      )}
    </div>
  )
})

export default EffectPanel
