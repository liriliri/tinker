import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  CaseUpper,
  FileText,
  File as FileIcon,
  Clipboard,
  Eraser,
} from 'lucide-react'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarSpacer,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarButtonGroup,
} from 'share/components/Toolbar'
import store from '../store'

export default observer(function ToolbarCompoent() {
  const { t } = useTranslation()

  const handlePaste = async () => {
    try {
      // Try to get file paths from clipboard first
      const filePaths = await tinker.getClipboardFilePaths()

      if (filePaths && filePaths.length > 0) {
        // If clipboard contains files, switch to file mode and process the first file
        store.setInputType('file')
        await store.handleFilePath(filePaths[0])
      } else {
        // Otherwise, try to get text from clipboard
        const text = await navigator.clipboard.readText()
        if (text) {
          store.setInput(text)
          store.setInputType('text')
        }
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err)
    }
  }

  return (
    <Toolbar>
      <ToolbarButtonGroup>
        <ToolbarButton
          variant="toggle"
          active={store.inputType === 'text'}
          onClick={() => store.setInputType('text')}
          title={t('text')}
          className={`rounded-none rounded-l border-r ${tw.border}`}
        >
          <FileText size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarButton
          variant="toggle"
          active={store.inputType === 'file'}
          onClick={() => store.setInputType('file')}
          title={t('file')}
          className="rounded-none rounded-r"
        >
          <FileIcon size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </ToolbarButtonGroup>

      <ToolbarSeparator />

      <ToolbarButton onClick={handlePaste} title={t('paste')}>
        <Clipboard size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={() => store.clear()} title={t('clear')}>
        <Eraser size={TOOLBAR_ICON_SIZE} />
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
