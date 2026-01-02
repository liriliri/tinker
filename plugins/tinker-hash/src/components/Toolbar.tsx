import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { CaseUpper } from 'lucide-react'
import {
  Toolbar,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import Select from 'share/components/Select'
import store from '../store'

export default observer(function HashToolbar() {
  const { t } = useTranslation()

  const inputTypeOptions = [
    { label: t('text'), value: 'text' },
    { label: t('file'), value: 'file' },
  ]

  return (
    <Toolbar>
      <Select
        value={store.inputType}
        onChange={(value) => store.setInputType(value)}
        options={inputTypeOptions}
      />

      <ToolbarSpacer />

      <ToolbarButton
        variant="toggle"
        active={store.uppercase}
        onClick={() => store.setUppercase(!store.uppercase)}
        title={t('uppercase')}
      >
        <CaseUpper size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
