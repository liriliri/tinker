import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Clipboard, Eraser, Copy, Check } from 'lucide-react'
import isStrBlank from 'licia/isStrBlank'
import { tw } from 'share/theme'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import {
  Toolbar,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import Select from 'share/components/Select'
import store from '../store'
import {
  urlEncode,
  urlDecode,
  morseEncode,
  morseDecode,
  unicodeEncode,
  unicodeDecode,
} from '../lib/encoder'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const { copied, copyToClipboard } = useCopyToClipboard()

  const handleEncode = () => {
    try {
      let result = ''
      if (store.encodingType === 'url') {
        result = urlEncode(store.inputText)
      } else if (store.encodingType === 'morse') {
        result = morseEncode(store.inputText)
      } else if (store.encodingType === 'unicode') {
        result = unicodeEncode(store.inputText)
      }
      store.setOutputText(result)
    } catch (error) {
      console.error('Encoding failed:', error)
    }
  }

  const handleDecode = () => {
    try {
      let result = ''
      if (store.encodingType === 'url') {
        result = urlDecode(store.inputText)
      } else if (store.encodingType === 'morse') {
        result = morseDecode(store.inputText)
      } else if (store.encodingType === 'unicode') {
        result = unicodeDecode(store.inputText)
      }
      store.setOutputText(result)
    } catch (error) {
      console.error('Decoding failed:', error)
    }
  }

  const handleClear = () => {
    store.clearInput()
    store.clearOutput()
  }

  const handleCopyOutput = () => {
    copyToClipboard(store.outputText)
  }

  const encodingOptions = [
    { value: 'url', label: t('urlEncoding') },
    { value: 'morse', label: t('morseCode') },
    { value: 'unicode', label: t('unicode') },
  ]

  return (
    <Toolbar className="justify-between">
      <div className="flex items-center gap-2">
        <ToolbarButton onClick={() => store.pasteToInput()} title={t('paste')}>
          <Clipboard size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleClear}
          disabled={isStrBlank(store.inputText)}
          title={t('clear')}
        >
          <Eraser size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          onClick={handleCopyOutput}
          disabled={isStrBlank(store.outputText)}
          title={t('copy')}
        >
          {copied ? (
            <Check size={TOOLBAR_ICON_SIZE} className={tw.primary.text} />
          ) : (
            <Copy size={TOOLBAR_ICON_SIZE} />
          )}
        </ToolbarButton>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={store.encodingType}
          onChange={(value) => {
            store.setEncodingType(value as any)
            store.clearOutput()
          }}
          options={encodingOptions}
          title={t('encodingType')}
        />
        <button
          onClick={handleEncode}
          disabled={isStrBlank(store.inputText)}
          className={`px-3 py-1 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {t('encode')}
        </button>
        <button
          onClick={handleDecode}
          disabled={isStrBlank(store.inputText)}
          className={`px-3 py-1 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {t('decode')}
        </button>
      </div>
    </Toolbar>
  )
})
