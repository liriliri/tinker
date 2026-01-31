import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  File as FileIcon,
  Clipboard,
  Eraser,
  Copy,
  Check,
  Save,
} from 'lucide-react'
import isStrBlank from 'licia/isStrBlank'
import { tw } from 'share/theme'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import {
  Toolbar,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const { copied, copyToClipboard } = useCopyToClipboard()

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

        <ToolbarButton onClick={handleClear} title={t('clear')}>
          <Eraser size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSeparator />

        {store.inputType === 'text' && (
          <ToolbarButton
            onClick={() => copyToClipboard(store.outputText)}
            disabled={isStrBlank(store.outputText)}
            title={t('copy')}
          >
            {copied ? (
              <Check size={TOOLBAR_ICON_SIZE} className={tw.primary.text} />
            ) : (
              <Copy size={TOOLBAR_ICON_SIZE} />
            )}
          </ToolbarButton>
        )}

        {store.inputType === 'file' && (
          <ToolbarButton
            onClick={() => copyToClipboard(store.fileBase64)}
            disabled={isStrBlank(store.fileBase64)}
            title={t('copy')}
          >
            {copied ? (
              <Check size={TOOLBAR_ICON_SIZE} className={tw.primary.text} />
            ) : (
              <Copy size={TOOLBAR_ICON_SIZE} />
            )}
          </ToolbarButton>
        )}
      </div>

      <div className="flex items-center gap-2">
        {store.inputType === 'text' && (
          <>
            <button
              onClick={() => store.encodeText()}
              disabled={isStrBlank(store.inputText)}
              className={`px-3 py-1 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {t('encode')}
            </button>
            <button
              onClick={() => store.decodeText()}
              disabled={isStrBlank(store.inputText)}
              className={`px-3 py-1 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {t('decode')}
            </button>
            <button
              onClick={() => store.decodeToFile()}
              disabled={isStrBlank(store.inputText)}
              className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${tw.primary.bg} ${tw.primary.bgHover} text-white disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <Save size={12} />
              {t('decodeToFile')}
            </button>
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
