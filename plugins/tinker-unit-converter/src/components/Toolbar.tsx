import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import Select from 'share/components/Select'
import {
  Toolbar as ToolbarContainer,
  ToolbarSpacer,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()

  const typeOptions = useMemo(
    () =>
      store.unitTypes.map((type) => ({
        label: t(type.typeKey),
        value: type.key,
      })),
    [t]
  )

  const unitOptions = useMemo(
    () =>
      store.currentUnits.map((unit) => ({
        value: unit.value,
        label: `${unit.label} - ${t(unit.unitKey)}`,
      })),
    [t, store.type]
  )

  return (
    <ToolbarContainer>
      <Select
        value={store.type}
        onChange={(value) => store.setType(value as string)}
        options={typeOptions}
      />

      <ToolbarSpacer />

      <input
        type="text"
        value={store.input}
        onChange={(e) => store.setInput(e.target.value)}
        className={`w-32 px-2 py-1 text-xs rounded border ${tw.border.both} ${tw.bg.light.primary} ${tw.bg.dark.primary} ${tw.text.light.primary} ${tw.text.dark.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing}`}
        placeholder={t('inputPlaceholder')}
      />

      <Select
        value={store.from}
        onChange={(value) => store.setFrom(value as string)}
        options={unitOptions}
      />
    </ToolbarContainer>
  )
})
