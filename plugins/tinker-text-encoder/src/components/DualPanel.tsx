import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Clipboard, Eraser, Copy } from 'lucide-react'
import isStrBlank from 'licia/isStrBlank'
import { tw } from 'share/theme'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import { Toolbar, TOOLBAR_ICON_SIZE } from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import Select from 'share/components/Select'
import store from '../store'
import {
  urlEncode,
  urlDecode,
  morseEncode,
  morseDecode,
} from '../lib/encoder'

export default observer(function DualPanel() {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()

  const handleEncode = () => {
    try {
      let result = ''
      if (store.encodingType === 'url') {
        result = urlEncode(store.inputText)
      } else if (store.encodingType === 'morse') {
        result = morseEncode(store.inputText)
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
      }
      store.setOutputText(result)
    } catch (error) {
      console.error('Decoding failed:', error)
    }
  }

  const handleCopyOutput = () => {
    copyToClipboard(store.outputText)
  }

  const encodingOptions = [
    { value: 'url', label: t('urlEncoding') },
    { value: 'morse', label: t('morseCode') },
  ]

  return (
    <div className="h-full w-full flex">
      {/* Left Panel - Input */}
      <div className={`flex-1 min-w-0 border-r ${tw.border.both} flex flex-col`}>
        <Toolbar className="justify-between h-8">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {t('input')}
          </span>
          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => store.pasteToInput()}
              title={t('paste')}
            >
              <Clipboard size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => store.clearInput()}
              disabled={isStrBlank(store.inputText)}
              title={t('clear')}
            >
              <Eraser size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
          </div>
        </Toolbar>
        <textarea
          value={store.inputText}
          onChange={(e) => store.setInputText(e.target.value)}
          className={`flex-1 w-full p-4 resize-none outline-none ${tw.bg.light.primary} ${tw.bg.dark.primary} text-gray-800 dark:text-gray-200`}
          placeholder={t('inputPlaceholder')}
        />
      </div>

      {/* Right Panel - Output */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Toolbar className="justify-between h-8">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {t('output')}
            </span>
            <Select
              value={store.encodingType}
              onChange={(value) => store.setEncodingType(value as any)}
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
          <div className="flex gap-1">
            <ToolbarButton
              onClick={handleCopyOutput}
              disabled={isStrBlank(store.outputText)}
              title={t('copy')}
            >
              <Copy size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => store.clearOutput()}
              disabled={isStrBlank(store.outputText)}
              title={t('clear')}
            >
              <Eraser size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
          </div>
        </Toolbar>
        <textarea
          value={store.outputText}
          readOnly
          className={`flex-1 w-full p-4 resize-none outline-none ${tw.bg.light.primary} ${tw.bg.dark.primary} text-gray-800 dark:text-gray-200`}
          placeholder={t('outputPlaceholder')}
        />
      </div>
    </div>
  )
})
