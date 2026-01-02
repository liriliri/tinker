import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { CaseUpper, FileText, File as FileIcon, Clipboard } from 'lucide-react'
import {
  Toolbar,
  ToolbarSpacer,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import store from '../store'

export default observer(function HashToolbar() {
  const { t } = useTranslation()

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        store.setInput(text)
        store.setInputType('text')
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err)
    }
  }

  return (
    <Toolbar>
      <ToolbarButton
        variant="toggle"
        active={store.inputType === 'text'}
        onClick={() => store.setInputType('text')}
        title={t('text')}
      >
        <FileText size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        variant="toggle"
        active={store.inputType === 'file'}
        onClick={() => store.setInputType('file')}
        title={t('file')}
      >
        <FileIcon size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton onClick={handlePaste} title={t('paste')}>
        <Clipboard size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

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
