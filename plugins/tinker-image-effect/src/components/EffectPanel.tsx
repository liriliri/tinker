import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import Select from 'share/components/Select'
import store from '../store'
import { ASCII_CHARSET_OPTIONS, type AsciiCharset } from '../types'
import EffectParams from './EffectParams'

const EffectPanel = observer(function EffectPanel() {
  const { t, i18n } = useTranslation()

  const charsetOptions = useMemo(
    () =>
      ASCII_CHARSET_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t, i18n.language]
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {store.effectId === 'ascii' && (
        <div className="shrink-0 px-3 pt-3">
          <Select<AsciiCharset>
            className="w-full"
            value={store.params.ascii.charset}
            onChange={(value) => store.setAsciiParam('charset', value)}
            options={charsetOptions}
          />
        </div>
      )}
      <OverlayScrollbars defer className="min-h-0 flex-1">
        <div className="px-3 py-3">
          <EffectParams />
        </div>
      </OverlayScrollbars>
    </div>
  )
})

export default EffectPanel
