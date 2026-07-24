import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Binary, FileText } from 'lucide-react'
import { Editor } from '@monaco-editor/react'
import noop from 'licia/noop'
import convertBin from 'licia/convertBin'
import HexEditor from 'share/components/HexEditor'
import CopyButton from 'share/components/CopyButton'
import {
  Toolbar,
  ToolbarButton,
  ToolbarButtonGroup,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'
import {
  bytesToText,
  formatBytesAsHex,
  textToBytes,
  tryFormatJson,
} from '../lib/format'

export default observer(function MessageDetail() {
  const { t } = useTranslation()
  const msg = store.selectedMessage
  const mode = store.detailViewMode
  const showHex = mode === 'hex'

  const { textContent, language } = useMemo(() => {
    if (!msg) return { textContent: '', language: 'plaintext' }
    const raw = msg.isBinary && msg.bytes ? bytesToText(msg.bytes) : msg.data
    const formatted = tryFormatJson(raw)
    return {
      textContent: formatted || raw,
      language: formatted ? 'json' : 'plaintext',
    }
  }, [msg])

  const hexData = useMemo(() => {
    if (!msg) return new Uint8Array(0)
    if (msg.isBinary && msg.bytes) {
      return convertBin(msg.bytes, 'Uint8Array') as Uint8Array
    }
    return textToBytes(msg.data)
  }, [msg])

  const copyText = showHex ? formatBytesAsHex(hexData) : textContent

  return (
    <div className="h-full flex flex-col min-h-0">
      <Toolbar>
        <ToolbarButtonGroup>
          <ToolbarButton
            className={`rounded-none rounded-l border-r ${tw.border}`}
            variant="toggle"
            active={!showHex}
            disabled={!msg}
            onClick={() => store.setDetailViewMode('text')}
            title={t('textMode')}
          >
            <FileText size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton
            className="rounded-none rounded-r"
            variant="toggle"
            active={showHex}
            disabled={!msg}
            onClick={() => store.setDetailViewMode('hex')}
            title={t('hexMode')}
          >
            <Binary size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        </ToolbarButtonGroup>

        <ToolbarSpacer />
        <CopyButton
          text={copyText}
          variant="toolbar"
          title={t('copy')}
          disabled={!msg}
        />
      </Toolbar>

      {!msg ? (
        <div
          className={`flex-1 flex items-center justify-center text-xs ${tw.text.tertiary}`}
        >
          {t('noSelection')}
        </div>
      ) : showHex ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <HexEditor
            data={hexData}
            nonce={msg.timestamp}
            isDark={store.isDark}
            onSetValue={noop}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          <Editor
            value={textContent}
            language={language}
            theme={store.isDark ? 'vs-dark' : 'vs'}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              lineNumbers: 'off',
              folding: true,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>
      )}
    </div>
  )
})
