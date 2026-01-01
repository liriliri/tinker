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

  const encodingOptions = [
    { label: t('utf8'), value: 'utf-8' },
    { label: t('base64'), value: 'base64' },
    { label: t('hex'), value: 'hex' },
  ]

  const inputTypeOptions = [
    { label: t('text'), value: 'text' },
    { label: t('file'), value: 'file' },
  ]

  return (
    <Toolbar>
      <Select
        value={store.encoding}
        onChange={(value) => store.setEncoding(value)}
        options={encodingOptions}
      />

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
