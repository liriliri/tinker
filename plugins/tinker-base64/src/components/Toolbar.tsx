import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  File as FileIcon,
  Clipboard,
  Eraser,
  Save,
} from 'lucide-react'
import isStrBlank from 'licia/isStrBlank'
import { tw } from 'share/theme'
import {
  Toolbar,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarButtonGroup,
  ToolbarTextButton,
} from 'share/components/Toolbar'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const handlePaste = async () => {
    try {
      const filePaths = await tinker.getClipboardFilePaths()

      if (filePaths && filePaths.length > 0) {
        store.setInputType('file')
        await store.handleFilePath(filePaths[0])
      } else {
        const text = await navigator.clipboard.readText()
        if (text) {
          store.setInputText(text)
          store.setInputType('text')
        }
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err)
    }
  }

  const handleClear = () => {
    if (store.inputType === 'text') {
      store.clearText()
    } else {
      store.clearFile()
    }
  }

  return (
    <Toolbar className="justify-between">
      <div className="flex items-center gap-2">
        <ToolbarButtonGroup>
          <ToolbarButton
            variant="toggle"
            active={store.inputType === 'text'}
            onClick={() => store.setInputType('text')}
            title={t('text')}
            className={`rounded-none rounded-l border-r ${tw.border.both}`}
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

        <ToolbarButton onClick={handlePaste} title={t('paste')}>
          <Clipboard size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarButton onClick={handleClear} title={t('clear')}>
          <Eraser size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </div>

      <div className="flex items-center gap-2">
        {store.inputType === 'text' && (
          <>
            <ToolbarTextButton
              onClick={() => store.encodeText()}
              disabled={isStrBlank(store.inputText)}
            >
              {t('encode')}
            </ToolbarTextButton>
            <ToolbarTextButton
              onClick={() => store.decodeText()}
              disabled={isStrBlank(store.inputText)}
            >
              {t('decode')}
            </ToolbarTextButton>
            <ToolbarTextButton
              onClick={() => store.decodeToFile()}
              disabled={isStrBlank(store.inputText)}
              className="flex items-center gap-1"
            >
              <Save size={12} />
              {t('decodeToFile')}
            </ToolbarTextButton>
          </>
        )}

        {store.inputType === 'file' && (
          <Checkbox
            checked={store.outputAsDataUrl}
            onChange={(checked) => store.setOutputAsDataUrl(checked)}
          >
            Data URL
          </Checkbox>
        )}
      </div>
    </Toolbar>
  )
})
