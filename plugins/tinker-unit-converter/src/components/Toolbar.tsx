import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import Select from 'share/components/Select'
import {
  Toolbar as ToolbarContainer,
  ToolbarTextInput,
  ToolbarSpacer,
} from 'share/components/Toolbar'
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

      <ToolbarTextInput
        value={store.input}
        onChange={(e) => store.setInput(e.target.value)}
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
