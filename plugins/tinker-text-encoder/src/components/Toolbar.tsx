import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Clipboard, Eraser } from 'lucide-react'
import isStrBlank from 'licia/isStrBlank'
import {
  Toolbar,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarTextButton,
} from 'share/components/Toolbar'
import Select from 'share/components/Select'
import store from '../store'
import type { EncodingType } from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const handleEncode = () => {
    try {
      store.encodeText()
    } catch (error) {
      console.error('Encoding failed:', error)
    }
  }

  const handleDecode = () => {
    try {
      store.decodeText()
    } catch (error) {
      console.error('Decoding failed:', error)
    }
  }

  const handleClear = () => {
    store.clearInput()
    store.clearOutput()
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
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={store.encodingType}
          onChange={(value) => {
            store.setEncodingType(value as EncodingType)
            store.clearOutput()
          }}
          options={encodingOptions}
          title={t('encodingType')}
        />
        <ToolbarTextButton
          onClick={handleEncode}
          disabled={isStrBlank(store.inputText)}
        >
          {t('encode')}
        </ToolbarTextButton>
        <ToolbarTextButton
          onClick={handleDecode}
          disabled={isStrBlank(store.inputText)}
        >
          {t('decode')}
        </ToolbarTextButton>
      </div>
    </Toolbar>
  )
})
